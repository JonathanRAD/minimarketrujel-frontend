import ExcelJS from 'exceljs';
import { prisma } from '../../config/prisma';
import { productoRepository } from './producto.repository';
import { FuzzyMatchUtils } from '../../common/utils/fuzzy-match.utils';
import { geminiService } from '../../common/services/gemini.service';

export interface ItemPreAnalisisExcel {
  fila: number;
  codigoBarras: string;
  nombreExcel: string;
  categoria: string;
  marca: string;
  detalle: string;
  tamano: string;
  stock: number;
  unidadMedida: string;
  costo: number;
  precioVenta: number;
  fechaRegistro?: string;
  tienda?: string;
  tipoAccion: 'NUEVO' | 'ACTUALIZAR';
  coincidenciaDb?: {
    id: string;
    nombre: string;
    codigoBarras?: string;
    stockActual: number;
    puntaje: number;
  };
}

export interface ResumenPreAnalisisExcel {
  totalProcesados: number;
  totalNuevos: number;
  totalActualizar: number;
  items: ItemPreAnalisisExcel[];
}

export interface ResumenImportacionExcel {
  creados: number;
  actualizados: number;
  totalProcesados: number;
  errores: Array<{ fila: number; error: string }>;
}

export class ImportExcelService {
  /** Normaliza strings para comparación: minúsculas, sin acentos ni caracteres especiales */
  private normalizarString(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Normaliza texto de encabezados (sin acentos, mayúsculas, unificando saltos de línea) */
  private normalizarHeader(str: string): string {
    return (str || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Parsea fechas de celdas de Excel a un objeto Date */
  private parseFechaFila(val: string): Date | null {
    if (!val) return null;
    const str = val.trim();
    if (!str) return null;

    // Si es formato DD/MM/YYYY o DD-MM-YYYY
    const matchSlash = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (matchSlash) {
      const day = parseInt(matchSlash[1], 10);
      const month = parseInt(matchSlash[2], 10) - 1;
      let year = parseInt(matchSlash[3], 10);
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }

    // Si es una fecha JS convertible o ISO
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Verifica si una cadena de texto es una marca/detalle/presentación válida */
  private esTextoExtraValido(val: string): boolean {
    if (!val) return false;
    const str = val.trim();
    if (!str || str.length < 2) return false;
    if (!isNaN(Number(str.replace(',', '.')))) return false;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(str)) return false;
    return true;
  }

  /** Parsea numéricamente de manera segura celdas de Excel */
  private parseNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;

    let str = '';
    if (typeof val === 'object') {
      if ('result' in val) str = String(val.result || '').trim();
      else if ('text' in val) str = String(val.text || '').trim();
      else str = String(val).trim();
    } else {
      str = String(val).trim();
    }

    if (!str) return 0;
    str = str.replace(/[S\$s]\/\.?/gi, '').trim();

    if (str.endsWith('%')) {
      str = str.replace('%', '').trim();
    }

    if (/^\d+,\d+$/.test(str)) {
      str = str.replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+,\d+$/.test(str)) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }

    const match = str.match(/-?\d+(\.\d+)?/);
    if (!match) return 0;

    const num = parseFloat(match[0]);
    return isNaN(num) ? 0 : num;
  }

  private async generarCodigoInterno(): Promise<string> {
    let codigo = '';
    let existe = true;
    while (existe) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      codigo = `SC-${randomNum}`;
      const p = await productoRepository.obtenerPorCodigoBarras(codigo);
      if (!p) existe = false;
    }
    return codigo;
  }

  /**
   * Pre-analiza un archivo Excel sin modificar la base de datos (Lectura pura).
   * Devuelve un desglose fila por fila clasificando qué productos son CREADOS y cuáles ACTUALIZADOS.
   */
  async preanalizarExcel(buffer: Buffer, fechaCorte?: string): Promise<ResumenPreAnalisisExcel> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('El archivo Excel no contiene hojas de trabajo válidas.');
    }

    const dbProductos = await prisma.producto.findMany({
      include: { categoria: true },
    });

    let headerRowIndex = 1;
    let colMap: { [key: string]: number } = {};

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (Object.keys(colMap).length > 0) return;

      const rowValues = row.values as any[];
      const rowTexts = rowValues.map((v) => (v ? this.normalizarHeader(String(v)) : ''));

      const hasProductOrCode = rowTexts.some(
        (t) => t.includes('PRODUCTO') || t.includes('NOMBRE') || t.includes('ITEM') || t.includes('CODIGO') || t.includes('COD')
      );
      const hasStockOrPrice = rowTexts.some(
        (t) => t.includes('PRECIO') || t.includes('COSTO') || t.includes('STOCK') || t.includes('CANT')
      );

      if (hasProductOrCode && hasStockOrPrice) {
        rowTexts.forEach((text, colIdx) => {
          if (!text) return;
          const isValorOrSummary =
            text.includes('VALOR') || text.includes('GANANCIA') || text.includes('MINIMO') || text.includes('TOTAL');

          if (!colMap['codigo'] && (text.includes('COD') || text.includes('BARRA') || text.includes('EAN') || text.includes('SKU'))) {
            colMap['codigo'] = colIdx;
          } else if (!colMap['categoria'] && (text.includes('CATEGORIA') || text.includes('RUBRO') || text.includes('FAMILIA'))) {
            colMap['categoria'] = colIdx;
          } else if (
            !colMap['nombre'] &&
            (text === 'PRODUCTO' ||
              text === 'NOMBRE' ||
              text.includes('NOMBRE DEL PRODUCTO') ||
              text.includes('NOMBRE PRODUCTO') ||
              text === 'ITEM')
          ) {
            colMap['nombre'] = colIdx;
          } else if (!colMap['marca'] && (text.includes('MARCA') || text.includes('FABRICANTE'))) {
            colMap['marca'] = colIdx;
          } else if (!colMap['detalle'] && (text.includes('DESCRIPCION') || text.includes('DETALLE') || text.includes('VARIEDAD'))) {
            colMap['detalle'] = colIdx;
          } else if (!colMap['tamano'] && (text.includes('PRESENTACION') || text.includes('TAMANO') || text.includes('CONTENIDO'))) {
            colMap['tamano'] = colIdx;
          } else if (
            !colMap['stock'] &&
            !isValorOrSummary &&
            (text === 'STOCK' ||
              text === 'STOCK ACTUAL' ||
              text.includes('STOCK ACTUAL') ||
              text.includes('CANTIDAD') ||
              text.includes('CANT') ||
              text.includes('EXISTENCIA') ||
              text.includes('QTY'))
          ) {
            colMap['stock'] = colIdx;
          } else if (
            !colMap['unidad'] &&
            (text.includes('UNID') || text.includes('UNIDAD') || text.includes('MEDIDA') || text.includes('U.M'))
          ) {
            colMap['unidad'] = colIdx;
          } else if (
            !colMap['fechaRegistro'] &&
            (text.includes('FECHA DE REGISTRO') || text.includes('FECHA REGISTRO') || text.includes('FECHA COMPRA') || text.includes('FECHA'))
          ) {
            colMap['fechaRegistro'] = colIdx;
          } else if (!colMap['tienda'] && (text.includes('TIENDA') || text.includes('PROVEEDOR') || text.includes('ORIGEN'))) {
            colMap['tienda'] = colIdx;
          }
        });

        // Pasada 2A: Buscar PRECIO VENTA explícito
        rowTexts.forEach((text, colIdx) => {
          if (!text) return;
          const isValorOrSummary = text.includes('VALOR') || text.includes('GANANCIA');
          if (
            !colMap['precioVenta'] &&
            !isValorOrSummary &&
            !text.includes('COSTO') &&
            !text.includes('COMPRA') &&
            (text.includes('PRECIO VENTA') ||
              text.includes('PRECIO DE VENTA') ||
              text.includes('P.VENTA') ||
              text.includes('P. VENTA') ||
              text.includes('PVP'))
          ) {
            colMap['precioVenta'] = colIdx;
          }
        });

        // Pasada 2B: Buscar COSTO UNITARIO explícito
        rowTexts.forEach((text, colIdx) => {
          if (!text) return;
          const isValorOrSummary = text.includes('VALOR') || text.includes('GANANCIA');
          if (
            !colMap['costo'] &&
            !isValorOrSummary &&
            (text.includes('PRECIO UNITARIO') ||
              text.includes('PRECIO UNIT') ||
              text.includes('P.UNITARIO') ||
              text.includes('P. UNITARIO') ||
              text.includes('P.UNIT') ||
              text.includes('COSTO UNITARIO') ||
              text.includes('COSTO UNIT') ||
              text.includes('P.COSTO') ||
              text.includes('P. COSTO') ||
              text.includes('COSTO') ||
              text.includes('PRECIO COMPRA') ||
              text.includes('P.COMPRA') ||
              text.includes('COMPRA'))
          ) {
            colMap['costo'] = colIdx;
          }
        });

        // Pasada 2C: PRECIO GENERAL / PRECIO PAQUETE
        rowTexts.forEach((text, colIdx) => {
          if (!text) return;
          const isValorOrSummary = text.includes('VALOR') || text.includes('GANANCIA');
          if (
            !isValorOrSummary &&
            (text === 'PRECIO' ||
              text.includes('PRECIO TOTAL') ||
              text.includes('PRECIO PAQUETE') ||
              text.includes('PRECIO LISTA'))
          ) {
            colMap['precioPaquete'] = colIdx;
            if (!colMap['precioVenta']) {
              colMap['precioVenta'] = colIdx;
            }
          }
        });

        if (!colMap['nombre']) {
          rowTexts.forEach((text, colIdx) => {
            if (text.includes('DESCRIPCION')) colMap['nombre'] = colIdx;
          });
        }

        if (colMap['nombre'] || colMap['codigo']) {
          headerRowIndex = rowNumber;
        }
      }
    });

    if (!colMap['nombre'] && !colMap['categoria']) {
      colMap = {
        codigo: 1,
        nombre: 2,
        categoria: 3,
        precioVenta: 4,
        costo: 5,
        stock: 7,
        unidad: 9,
      };
    }

    const items: ItemPreAnalisisExcel[] = [];
    let totalNuevos = 0;
    let totalActualizar = 0;

    const rowCount = worksheet.rowCount;
    for (let r = headerRowIndex + 1; r <= rowCount; r++) {
      const row = worksheet.getRow(r);
      if (!row.hasValues) continue;

      const getCellRawVal = (colIdx?: number): any => {
        if (!colIdx) return null;
        const cell = row.getCell(colIdx);
        return cell ? cell.value : null;
      };

      const getCellStrVal = (colIdx?: number): string => {
        const val = getCellRawVal(colIdx);
        if (val === null || val === undefined) return '';
        if (typeof val === 'object' && 'result' in val) {
          return String((val as any).result || '').trim();
        }
        if (typeof val === 'object' && 'text' in val) {
          return String((val as any).text || '').trim();
        }
        return String(val).trim();
      };

      const rawNombre = getCellStrVal(colMap['nombre']);
      const rawCodigo = getCellStrVal(colMap['codigo']);

      const normNombreUpper = rawNombre.toUpperCase().trim();
      const normCodigoUpper = rawCodigo.toUpperCase().trim();

      if (
        !rawNombre ||
        normNombreUpper === 'NOMBRE' ||
        normNombreUpper === 'PRODUCTO' ||
        normNombreUpper.includes('NOMBRE DEL PRODUCTO') ||
        normNombreUpper.includes('CODIGO DE BARRAS') ||
        normNombreUpper.includes('FECHA DE EMISION') ||
        normNombreUpper.includes('TOTAL REGISTROS') ||
        normNombreUpper.includes('MINIMARKET -') ||
        normNombreUpper.includes('CATALOGO GENERAL') ||
        normNombreUpper.includes('TOTALES GENERALES') ||
        normCodigoUpper.includes('CODIGO DE BARRAS') ||
        normCodigoUpper === 'CODIGO'
      ) {
        continue;
      }

      // Si hay fechaCorte configurada, SOLO procesar filas con fecha válida >= fechaCorte
      if (fechaCorte) {
        const rawFechaFila = colMap['fechaRegistro'] ? getCellStrVal(colMap['fechaRegistro']) : '';
        const fechaFilaDate = this.parseFechaFila(rawFechaFila);

        if (!fechaFilaDate) {
          continue; // Omitir sin fecha válida
        }

        const fechaCorteLimit = new Date(fechaCorte);
        fechaCorteLimit.setHours(0, 0, 0, 0);
        fechaFilaDate.setHours(0, 0, 0, 0);

        if (fechaFilaDate < fechaCorteLimit) {
          continue; // Omitir fecha previa
        }
      }

      const rawCategoria = getCellStrVal(colMap['categoria']) || 'ABARROTES';
      const rawMarca = getCellStrVal(colMap['marca']);
      const rawDetalle = getCellStrVal(colMap['detalle']);
      const rawTamano = getCellStrVal(colMap['tamano']);
      const rawStock = this.parseNumber(getCellRawVal(colMap['stock']));
      const rawUnidad = getCellStrVal(colMap['unidad']) || 'UNIDAD';
      const rawFechaStr = colMap['fechaRegistro'] ? getCellStrVal(colMap['fechaRegistro']) : '';
      const rawTiendaStr = colMap['tienda'] ? getCellStrVal(colMap['tienda']) : '';

      let rawCosto = this.parseNumber(getCellRawVal(colMap['costo']));
      let rawPrecioVenta = this.parseNumber(getCellRawVal(colMap['precioVenta']));
      const rawPrecioPaquete = this.parseNumber(getCellRawVal(colMap['precioPaquete']));

      if (rawCosto === 0 && rawPrecioPaquete > 0 && rawStock > 0 && colMap['costo'] !== colMap['precioPaquete']) {
        rawCosto = Math.round((rawPrecioPaquete / rawStock) * 10000) / 10000;
      }

      // CONSTRUCCIÓN COMPLETA DE NOMBRE ANTES DE MATCHING
      let nombreCompleto = rawNombre;
      if (!nombreCompleto) {
        nombreCompleto = [rawCategoria, rawMarca, rawDetalle, rawTamano]
          .filter((v) => v && this.esTextoExtraValido(v))
          .join(' ')
          .trim();
      } else {
        const normNombre = this.normalizarString(nombreCompleto);
        const normCat = this.normalizarString(rawCategoria);

        const extras = [rawMarca, rawDetalle, rawTamano]
          .filter((item) => {
            if (!item || !this.esTextoExtraValido(item)) return false;
            const normItem = this.normalizarString(item);
            if (normItem === normCat) return false;
            return !normNombre.includes(normItem);
          })
          .join(' ');

        if (extras) {
          nombreCompleto = `${nombreCompleto} ${extras}`.trim();
        }
      }

      if (!nombreCompleto || nombreCompleto.length < 2) {
        continue;
      }

      const normNombreFinal = this.normalizarString(nombreCompleto);

      // Emparejamiento por Nivel 1, 2 y 3 (Código, Nombre exacto, Fuzzy Matching)
      let productoExistente = dbProductos.find((p) => {
        if (rawCodigo && rawCodigo.length >= 3 && p.codigoBarras && p.codigoBarras === rawCodigo) return true;
        return this.normalizarString(p.nombre) === normNombreFinal;
      });

      let puntaje = 1.0;

      if (!productoExistente) {
        const matchFuzzy = FuzzyMatchUtils.buscarMejorCoincidencia(
          nombreCompleto,
          dbProductos.map((p) => ({ id: p.id, nombre: p.nombre })),
          0.72
        );
        if (matchFuzzy) {
          productoExistente = dbProductos.find((p) => p.id === matchFuzzy.producto.id);
          puntaje = matchFuzzy.puntaje;
        }
      }

      const tipoAccion: 'NUEVO' | 'ACTUALIZAR' = productoExistente ? 'ACTUALIZAR' : 'NUEVO';
      if (tipoAccion === 'NUEVO') totalNuevos++;
      else totalActualizar++;

      items.push({
        fila: r,
        codigoBarras: rawCodigo || 'SC-AUTO',
        nombreExcel: nombreCompleto,
        categoria: rawCategoria,
        marca: rawMarca,
        detalle: rawDetalle,
        tamano: rawTamano,
        stock: rawStock,
        unidadMedida: rawUnidad,
        costo: rawCosto,
        precioVenta: rawPrecioVenta,
        fechaRegistro: rawFechaStr,
        tienda: rawTiendaStr,
        tipoAccion,
        coincidenciaDb: productoExistente
          ? {
              id: productoExistente.id,
              nombre: productoExistente.nombre,
              codigoBarras: productoExistente.codigoBarras || undefined,
              stockActual: Number(productoExistente.stockActual),
              puntaje,
            }
          : undefined,
      });
    }

    return {
      totalProcesados: items.length,
      totalNuevos,
      totalActualizar,
      items,
    };
  }

  /**
   * Ejecuta la importación procesando los ítems según las confirmaciones del usuario
   */
  async procesarExcel(
    buffer: Buffer,
    usuarioId: string,
    modoImportacion: 'REEMPLAZAR' | 'SUMAR' = 'REEMPLAZAR',
    fechaCorte?: string,
    overrideAcciones?: { [fila: number]: 'NUEVO' | 'ACTUALIZAR' }
  ): Promise<ResumenImportacionExcel> {
    const preAnalisis = await this.preanalizarExcel(buffer, fechaCorte);

    let finalUsuarioId: string | null = null;
    if (usuarioId) {
      const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
      if (u) finalUsuarioId = u.id;
    }
    if (!finalUsuarioId) {
      const defaultUser = await prisma.usuario.findFirst();
      if (defaultUser) finalUsuarioId = defaultUser.id;
    }

    const dbCategorias = await prisma.categoria.findMany();
    const categoriasMap = new Map<string, string>();
    dbCategorias.forEach((cat) => {
      categoriasMap.set(this.normalizarString(cat.nombre), cat.id);
    });

    const dbProductos = await prisma.producto.findMany();

    let creados = 0;
    let actualizados = 0;
    const errores: Array<{ fila: number; error: string }> = [];

    for (const item of preAnalisis.items) {
      const tipoAccionFinal = overrideAcciones?.[item.fila] || item.tipoAccion;

      try {
        // Categoria ID
        let categoriaId: string;
        const catNorm = this.normalizarString(item.categoria);
        if (categoriasMap.has(catNorm)) {
          categoriaId = categoriasMap.get(catNorm)!;
        } else {
          const nuevaCat = await prisma.categoria.create({
            data: { nombre: item.categoria.toUpperCase() },
          });
          categoriaId = nuevaCat.id;
          categoriasMap.set(catNorm, nuevaCat.id);
        }

        // Unidad de Medida
        let unidadMedida: 'UNIDAD' | 'KG' | 'G' | 'LITRO' | 'ML' = 'UNIDAD';
        const unidUpper = item.unidadMedida.toUpperCase();
        if (unidUpper.includes('KG') || unidUpper.includes('KILO')) unidadMedida = 'KG';
        else if (unidUpper.includes('GR') || unidUpper.includes('GRAMO') || unidUpper.includes('SOB')) unidadMedida = 'G';
        else if (unidUpper.includes('LITRO') || unidUpper.includes('LT')) unidadMedida = 'LITRO';
        else if (unidUpper.includes('ML')) unidadMedida = 'ML';

        if (tipoAccionFinal === 'ACTUALIZAR' && item.coincidenciaDb) {
          const prodDb = dbProductos.find((p) => p.id === item.coincidenciaDb!.id);
          if (prodDb) {
            const stockNuevo = modoImportacion === 'SUMAR'
              ? Number(prodDb.stockActual) + item.stock
              : item.stock;
            const costoNuevo = item.costo > 0 ? item.costo : Number(prodDb.costo);
            const precioNuevo = item.precioVenta > 0 ? item.precioVenta : Number(prodDb.precioVenta);

            const productoActualizado = await prisma.producto.update({
              where: { id: prodDb.id },
              data: {
                stockActual: stockNuevo,
                costo: costoNuevo,
                precioVenta: precioNuevo,
                activo: true,
              },
            });

            if (item.stock > 0 && finalUsuarioId) {
              try {
                await prisma.movimientoInventario.create({
                  data: {
                    productoId: productoActualizado.id,
                    tipo: 'AJUSTE',
                    cantidad: item.stock,
                    motivo: 'Importación masiva desde archivo Excel',
                    usuarioId: finalUsuarioId,
                  },
                });
              } catch (kardexErr) {}
            }

            actualizados++;
            continue;
          }
        }

        // De lo contrario, CREAR NUEVO PRODUCTO
        const codigoBarras = item.codigoBarras && item.codigoBarras.length >= 3 && !item.codigoBarras.startsWith('SC-AUTO')
          ? item.codigoBarras
          : await this.generarCodigoInterno();

        const nuevoProducto = await prisma.producto.create({
          data: {
            nombre: item.nombreExcel,
            codigoBarras,
            categoriaId,
            costo: item.costo,
            precioVenta: item.precioVenta,
            stockActual: item.stock,
            stockMinimo: 2,
            unidadMedida,
            activo: true,
          },
        });

        if (item.stock > 0 && finalUsuarioId) {
          try {
            await prisma.movimientoInventario.create({
              data: {
                productoId: nuevoProducto.id,
                tipo: 'AJUSTE',
                cantidad: item.stock,
                motivo: 'Carga inicial por importación masiva Excel',
                usuarioId: finalUsuarioId,
              },
            });
          } catch (kardexErr) {}
        }

        dbProductos.push(nuevoProducto as any);
        creados++;
      } catch (err: any) {
        errores.push({
          fila: item.fila,
          error: err.message || 'Error al procesar la fila',
        });
      }
    }

    return {
      creados,
      actualizados,
      totalProcesados: preAnalisis.items.length,
      errores,
    };
  }
}

export const importExcelService = new ImportExcelService();
