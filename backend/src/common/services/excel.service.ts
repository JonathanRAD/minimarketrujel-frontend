import { Response } from 'express';
import ExcelJS from 'exceljs';

export interface ColumnaExcel {
  header: string;
  key: string;
  width?: number;
  tipo?: 'texto' | 'moneda' | 'numero' | 'entero' | 'cantidad' | 'fecha' | 'booleano' | 'estado';
  alineacion?: 'left' | 'center' | 'right';
  esTotalizable?: boolean;
}

export interface HojaExcelConfig {
  nombreHoja: string;
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaExcel[];
  datos: any[];
  mostrarTotales?: boolean;
  columnaAgrupacion?: string; // Clave para agrupar en bloques (ej: 'codigoVenta')
  columnasACombinar?: string[]; // Columnas que se combinan verticalmente por grupo (ej: ['codigoVenta', 'fecha', 'metodoPago', 'cajero'])
}

export interface OpcionesReporteExcel {
  titulo: string;
  subtitulo?: string;
  nombreHoja?: string;
  nombreArchivo: string;
  columnas: ColumnaExcel[];
  datos: any[];
  mostrarTotales?: boolean;
}

export interface OpcionesReporteMultiHojas {
  nombreArchivo: string;
  hojas: HojaExcelConfig[];
}

export class ExcelService {
  /**
   * Genera y transmite un reporte Excel profesional con una sola hoja directamente en la respuesta HTTP Express.
   */
  async generarYEnviarReporte(res: Response, opciones: OpcionesReporteExcel): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Minimarket POS';
    workbook.created = new Date();

    this.construirHoja(workbook, {
      nombreHoja: opciones.nombreHoja || 'Reporte',
      titulo: opciones.titulo,
      subtitulo: opciones.subtitulo,
      columnas: opciones.columnas,
      datos: opciones.datos,
      mostrarTotales: opciones.mostrarTotales,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${opciones.nombreArchivo}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Genera y transmite un reporte Excel profesional con múltiples hojas (pestañas).
   */
  async generarYEnviarReporteMultiHojas(res: Response, opciones: OpcionesReporteMultiHojas): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Minimarket POS';
    workbook.created = new Date();

    for (const hojaConfig of opciones.hojas) {
      this.construirHoja(workbook, hojaConfig);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${opciones.nombreArchivo}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Construye y formatea una hoja dentro del libro de trabajo con banner, cabecera, agrupaciones, filas cebra y totales.
   */
  public construirHoja(workbook: ExcelJS.Workbook, hoja: HojaExcelConfig): void {
    const worksheet = workbook.addWorksheet(hoja.nombreHoja, {
      views: [{ showGridLines: true }],
    });

    const colsCount = hoja.columnas.length;
    const endColLetter = this.obtenerLetraColumna(colsCount);

    // ==========================================
    // 1. BANNER DE TÍTULO Y ENCABEZADO
    // ==========================================
    worksheet.addRow([]);
    worksheet.getRow(1).height = 10;

    worksheet.mergeCells(`A2:${endColLetter}2`);
    const cellTitulo = worksheet.getCell('A2');
    cellTitulo.value = `MINIMARKET - ${hoja.titulo.toUpperCase()}`;
    cellTitulo.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    cellTitulo.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' },
    };
    cellTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 36;

    if (hoja.subtitulo) {
      worksheet.mergeCells(`A3:${endColLetter}3`);
      const cellSub = worksheet.getCell('A3');
      cellSub.value = hoja.subtitulo;
      cellSub.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'F8FAFC' } };
      cellSub.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' },
      };
      cellSub.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(3).height = 24;
    }

    const filaMetaNum = hoja.subtitulo ? 4 : 3;
    worksheet.mergeCells(`A${filaMetaNum}:${endColLetter}${filaMetaNum}`);
    const cellMeta = worksheet.getCell(`A${filaMetaNum}`);
    const fechaHora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    cellMeta.value = `Fecha de emisión: ${fechaHora}  |  Total registros: ${hoja.datos.length}`;
    cellMeta.font = { name: 'Calibri', size: 9.5, color: { argb: '475569' } };
    cellMeta.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' },
    };
    cellMeta.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(filaMetaNum).height = 20;

    const filaSepNum = filaMetaNum + 1;
    worksheet.addRow([]);
    worksheet.getRow(filaSepNum).height = 12;

    // ==========================================
    // 2. TABLA: ENCABEZADOS DE COLUMNA
    // ==========================================
    const filaHeaderNum = filaSepNum + 1;
    const headerRowValues = hoja.columnas.map((c) => c.header);
    const headerRow = worksheet.addRow(headerRowValues);
    headerRow.height = 28;

    headerRow.eachCell((cell, colIndex) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' },
      };
      const colDef = hoja.columnas[colIndex - 1];
      const esNumerico = colDef?.tipo === 'moneda' || colDef?.tipo === 'numero' || colDef?.tipo === 'entero' || colDef?.tipo === 'cantidad';
      const align = colDef?.alineacion || (esNumerico ? 'right' : (colDef?.tipo === 'fecha' || colDef?.tipo === 'booleano' || colDef?.tipo === 'estado' ? 'center' : 'left'));

      cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: '1D4ED8' } },
        bottom: { style: 'medium', color: { argb: '0F172A' } },
        left: { style: 'thin', color: { argb: '60A5FA' } },
        right: { style: 'thin', color: { argb: '60A5FA' } },
      };
    });

    worksheet.autoFilter = {
      from: { row: filaHeaderNum, column: 1 },
      to: { row: filaHeaderNum, column: colsCount },
    };

    // ==========================================
    // 3. AGRUPACIÓN Y RENDERIZADO DE DATOS
    // ==========================================
    interface GrupoData {
      clave: string;
      items: any[];
    }

    const grupos: GrupoData[] = [];
    if (hoja.columnaAgrupacion) {
      hoja.datos.forEach((item) => {
        const clave = String(item[hoja.columnaAgrupacion!] ?? '');
        const ultimoGrupo = grupos[grupos.length - 1];
        if (ultimoGrupo && ultimoGrupo.clave === clave) {
          ultimoGrupo.items.push(item);
        } else {
          grupos.push({ clave, items: [item] });
        }
      });
    } else {
      hoja.datos.forEach((item, idx) => {
        grupos.push({ clave: String(idx), items: [item] });
      });
    }

    let currentRowIndex = filaHeaderNum + 1;

    grupos.forEach((grupo, gIndex) => {
      const isEvenGroup = gIndex % 2 === 0;
      // Contraste visible y armónico entre bloques de venta
      const bgArgb = isEvenGroup ? 'FFFFFF' : 'F1F5F9';
      const startRowForGroup = currentRowIndex;

      grupo.items.forEach((item, itemIdxInGroup) => {
        const isFirstInGroup = itemIdxInGroup === 0;
        const isLastInGroup = itemIdxInGroup === grupo.items.length - 1;

        const rowValues = hoja.columnas.map((col) => {
          const val = item[col.key];
          if (val === undefined || val === null) return '';
          if (col.tipo === 'fecha' && val) {
            return new Date(val);
          }
          if (col.tipo === 'moneda' || col.tipo === 'numero' || col.tipo === 'entero' || col.tipo === 'cantidad') {
            return Number(val) || 0;
          }
          if (col.tipo === 'booleano') {
            return val ? 'SÍ' : 'NO';
          }
          return val;
        });

        const row = worksheet.addRow(rowValues);
        row.height = 22;

        row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
          const colDef = hoja.columnas[colIndex - 1];
          if (!colDef) return;

          if (colDef.tipo === 'moneda') {
            cell.numFmt = '"S/" #,##0.00;[Red]-"S/" #,##0.00;"S/" 0.00';
          } else if (colDef.tipo === 'entero') {
            cell.numFmt = '#,##0';
          } else if (colDef.tipo === 'cantidad' || colDef.tipo === 'numero') {
            const numVal = Number(cell.value) || 0;
            if (Number.isInteger(numVal)) {
              cell.numFmt = '#,##0'; // Entero limpio: 1, 2, 10, 24
            } else {
              // Si es producto vendido por peso / fracción (ej: 0.50 kg, 1.250 kg)
              const strVal = numVal.toString();
              const numDecimals = strVal.includes('.') ? strVal.split('.')[1].length : 0;
              cell.numFmt = numDecimals > 2 ? '#,##0.000' : '#,##0.00';
            }
          } else if (colDef.tipo === 'fecha' && cell.value instanceof Date) {
            cell.numFmt = 'DD/MM/YYYY HH:mm';
          }

          const esNumerico = colDef.tipo === 'moneda' || colDef.tipo === 'numero' || colDef.tipo === 'entero' || colDef.tipo === 'cantidad';
          const align = colDef.alineacion || (esNumerico ? 'right' : (colDef.tipo === 'fecha' || colDef.tipo === 'booleano' || colDef.tipo === 'estado' ? 'center' : 'left'));

          cell.alignment = { horizontal: align, vertical: 'middle' };
          cell.font = { name: 'Calibri', size: 10, color: { argb: '1E293B' } };

          if (colDef.tipo === 'estado') {
            const textVal = String(cell.value || '').toUpperCase();
            if (textVal.includes('ACTIVO') || textVal.includes('COMPLETADA') || textVal.includes('RECIBIDA') || textVal.includes('ABIERTO')) {
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '166534' } };
            } else if (textVal.includes('INACTIVO') || textVal.includes('ANULADA') || textVal.includes('CANCELADA') || textVal.includes('CERRADO')) {
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '991B1B' } };
            }
          }

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgArgb },
          };

          // ==========================================
          // BORDES DISTINTIVOS DE GRUPO/VENTA
          // ==========================================
          // Línea divisoria sólida y oscura arriba y abajo de cada venta
          cell.border = {
            top: isFirstInGroup
              ? { style: 'medium', color: { argb: '334155' } } // Límite superior de la venta
              : { style: 'thin', color: { argb: 'E2E8F0' } },  // Línea interna entre productos
            bottom: isLastInGroup
              ? { style: 'medium', color: { argb: '334155' } } // Límite inferior marcado entre ventas
              : { style: 'thin', color: { argb: 'E2E8F0' } },  // Línea interna entre productos
            left: { style: 'thin', color: { argb: 'CBD5E1' } },
            right: { style: 'thin', color: { argb: 'CBD5E1' } },
          };
        });

        currentRowIndex++;
      });

      const endRowForGroup = currentRowIndex - 1;

      // ==========================================
      // COMBINAR (MERGE) CELDAS COMUNES DEL GRUPO
      // ==========================================
      if (hoja.columnasACombinar && grupo.items.length > 1) {
        hoja.columnasACombinar.forEach((colKey) => {
          const colIdx = hoja.columnas.findIndex((c) => c.key === colKey) + 1;
          if (colIdx > 0) {
            try {
              worksheet.mergeCells(startRowForGroup, colIdx, endRowForGroup, colIdx);
              const topCell = worksheet.getCell(startRowForGroup, colIdx);
              const colDef = hoja.columnas[colIdx - 1];
              topCell.alignment = {
                horizontal: colDef?.alineacion || 'center',
                vertical: 'middle',
                wrapText: true,
              };

              // Formatear todas las celdas del rango combinado para bordes consistentes en Excel
              for (let r = startRowForGroup; r <= endRowForGroup; r++) {
                const c = worksheet.getCell(r, colIdx);
                c.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: bgArgb },
                };
                c.border = {
                  top: r === startRowForGroup
                    ? { style: 'medium', color: { argb: '334155' } }
                    : { style: 'thin', color: { argb: 'E2E8F0' } },
                  bottom: r === endRowForGroup
                    ? { style: 'medium', color: { argb: '334155' } }
                    : { style: 'thin', color: { argb: 'E2E8F0' } },
                  left: { style: 'medium', color: { argb: '94A3B8' } },
                  right: { style: 'medium', color: { argb: '94A3B8' } },
                };
              }

              // Resaltar ID de Venta en negrita azul
              if (colDef?.key === 'codigo' || colDef?.key === 'codigoVenta' || colDef?.key === 'codigoCompra') {
                topCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '1E40AF' } };
              }
            } catch (err) {}
          }
        });
      }
    });

    // ==========================================
    // 4. FILA DE TOTALES
    // ==========================================
    if (hoja.mostrarTotales && hoja.datos.length > 0) {
      const totalsValues: any[] = [];

      hoja.columnas.forEach((col, idx) => {
        if (idx === 0) {
          totalsValues.push('TOTALES GENERALES');
        } else if (col.esTotalizable) {
          const suma = hoja.datos.reduce((acc, curr) => acc + (Number(curr[col.key]) || 0), 0);
          totalsValues.push(suma);
        } else {
          totalsValues.push('');
        }
      });

      const totalRow = worksheet.addRow(totalsValues);
      totalRow.height = 26;

      totalRow.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        const colDef = hoja.columnas[colIndex - 1];
        if (!colDef) return;

        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E2E8F0' },
        };

        if (colDef.tipo === 'moneda') {
          cell.numFmt = '"S/" #,##0.00';
        } else if (colDef.tipo === 'entero') {
          cell.numFmt = '#,##0';
        } else if (colDef.tipo === 'cantidad' || colDef.tipo === 'numero') {
          const numVal = Number(cell.value) || 0;
          cell.numFmt = Number.isInteger(numVal) ? '#,##0' : '#,##0.00';
        }

        const esNumerico = colDef.tipo === 'moneda' || colDef.tipo === 'numero' || colDef.tipo === 'entero' || colDef.tipo === 'cantidad';
        const align = colIndex === 1 ? 'left' : colDef.alineacion || (esNumerico ? 'right' : 'center');
        cell.alignment = { horizontal: align, vertical: 'middle' };

        cell.border = {
          top: { style: 'medium', color: { argb: '0F172A' } },
          bottom: { style: 'double', color: { argb: '0F172A' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } },
        };
      });
    }

    // ==========================================
    // 5. AJUSTE DINÁMICO DE ANCHO DE COLUMNAS
    // ==========================================
    hoja.columnas.forEach((col, idx) => {
      const colNumber = idx + 1;
      let maxLen = col.header.length;

      hoja.datos.forEach((item) => {
        const val = item[col.key];
        if (val !== undefined && val !== null) {
          let strVal = String(val);
          if (col.tipo === 'moneda') strVal = `S/ ${Number(val).toFixed(2)}`;
          if (strVal.length > maxLen) maxLen = strVal.length;
        }
      });

      const column = worksheet.getColumn(colNumber);
      column.width = Math.max(col.width || 14, maxLen + 4);
    });
  }

  private obtenerLetraColumna(colIndex: number): string {
    let temp = 0;
    let letter = '';
    while (colIndex > 0) {
      temp = (colIndex - 1) % 26;
      letter = String.fromCharCode(65 + temp) + letter;
      colIndex = Math.floor((colIndex - temp - 1) / 26);
    }
    return letter;
  }
}

export const excelService = new ExcelService();
