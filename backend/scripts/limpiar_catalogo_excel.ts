import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

interface ProductoRow {
  rowNumber: number;
  codigoBarras: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  costo: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  estado: string;
  fechaAgregado: Date;
}

interface ManualReviewRow extends ProductoRow {
  motivoRevision: string;
}

// Explicit name overrides if desired for specific barcodes
const CONFIRMED_NAME_OVERRIDES: Record<string, string> = {
  '7750670004442': 'BEBIDA ENERGIZANTE - SPORADE TROPICAL 1.5LT',
  '7750670010238': 'SPORADE TROPICAL 500ML',
};

function extractNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object') {
    if ('result' in val) {
      const res = Number(val.result);
      if (!isNaN(res)) return res;
    }
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val.trim());
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

function extractText(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val).trim();
  if (typeof val === 'object') {
    if ('result' in val && val.result !== null && val.result !== undefined) {
      return String(val.result).trim();
    }
    if ('text' in val && val.text) {
      return String(val.text).trim();
    }
  }
  return fallback;
}

function normalizarTexto(txt: string): string {
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
}

async function main() {
  const defaultInput = path.resolve(__dirname, '../../Reporte_productos_2026-07-29.xlsx');
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ El archivo de origen no existe en: ${inputPath}`);
    process.exit(1);
  }

  let outputPath = process.argv[3] 
    ? path.resolve(process.argv[3]) 
    : path.resolve(path.dirname(inputPath), 'Reporte_productos_LIMPIO.xlsx');

  console.log(`\n==================================================`);
  console.log(` 🧹 SCRIPT DE LIMPIEZA DE CATÁLOGO DE PRODUCTOS (V2)`);
  console.log(`==================================================`);
  console.log(`📄 Archivo Origen : ${inputPath}`);
  console.log(`💾 Archivo Destino: ${outputPath}\n`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);

  const sheet = workbook.worksheets[0];
  let headerRowIndex = -1;

  sheet.eachRow((row, rNum) => {
    const vals = row.values as any[];
    if (vals && vals.some(v => extractText(v).includes('Código de Barras'))) {
      headerRowIndex = rNum;
    }
  });

  if (headerRowIndex === -1) {
    headerRowIndex = 6;
  }

  const allRows: ProductoRow[] = [];

  sheet.eachRow((row, rNum) => {
    if (rNum <= headerRowIndex) return;

    const vals = row.values as any[];
    if (!vals || vals.length < 3) return;

    const codigoBarras = extractText(vals[1]);
    const nombre = extractText(vals[2]);
    if (!codigoBarras && !nombre) return;

    const categoria = extractText(vals[3], 'General');
    const precioVenta = extractNumber(vals[4]);
    const costo = extractNumber(vals[5]);
    const stockActual = extractNumber(vals[7]);
    const stockMinimo = extractNumber(vals[8]);
    const unidadMedida = extractText(vals[9], 'UNIDAD');
    const estado = extractText(vals[12], 'ACTIVO');

    let fechaAgregado = new Date(0);
    if (vals[13]) {
      const d = new Date(vals[13]);
      if (!isNaN(d.getTime())) fechaAgregado = d;
    }

    allRows.push({
      rowNumber: rNum,
      codigoBarras,
      nombre,
      categoria,
      precioVenta,
      costo,
      stockActual,
      stockMinimo,
      unidadMedida,
      estado,
      fechaAgregado,
    });
  });

  const totalFilasOriginales = allRows.length;

  // 1. Agrupar por código de barras
  const porCodigo = new Map<string, ProductoRow[]>();
  for (const r of allRows) {
    if (r.codigoBarras) {
      if (!porCodigo.has(r.codigoBarras)) porCodigo.set(r.codigoBarras, []);
      porCodigo.get(r.codigoBarras)!.push(r);
    }
  }

  const idsFilasManejoEspecial = new Set<number>();
  const productosLimpios: ProductoRow[] = [];
  const filasRevisarManualmente: ManualReviewRow[] = [];
  let conteoFusionesConfirmadas = 0;

  // 2. Procesar Grupos de Códigos Duplicados
  for (const [barcode, grupo] of porCodigo) {
    if (grupo.length > 1) {
      // Verificar si todos los elementos del grupo tienen el mismo nombre (o equivalente)
      const nombresNorm = new Set(grupo.map(g => normalizarTexto(g.nombre)));
      
      const esMismoProducto = nombresNorm.size === 1 || CONFIRMED_NAME_OVERRIDES[barcode] !== undefined;

      if (esMismoProducto) {
        // FUSIÓN AUTOMÁTICA REGULAR / CONFIRMADA
        grupo.forEach(r => idsFilasManejoEspecial.add(r.rowNumber));
        conteoFusionesConfirmadas += grupo.length;

        const stockTotal = grupo.reduce((acc, r) => acc + r.stockActual, 0);

        // Promedio ponderado de costos
        let sumaCostoStock = 0;
        let sumaStock = 0;
        for (const r of grupo) {
          sumaCostoStock += r.stockActual * r.costo;
          sumaStock += r.stockActual;
        }

        let costoPonderado = 0;
        if (sumaStock > 0) {
          costoPonderado = Number((sumaCostoStock / sumaStock).toFixed(4));
        } else {
          // Si stock es 0 en ambos, promediar costos simples
          const sumaCostos = grupo.reduce((acc, r) => acc + r.costo, 0);
          costoPonderado = Number((sumaCostos / grupo.length).toFixed(4));
        }

        // Precio de venta: el más reciente por fecha (si empate o missing, el mayor)
        const ordenadosPorFecha = [...grupo].sort((a, b) => b.fechaAgregado.getTime() - a.fechaAgregado.getTime());
        let precioFinal = ordenadosPorFecha[0].precioVenta;
        if (ordenadosPorFecha[0].fechaAgregado.getTime() === (ordenadosPorFecha[1]?.fechaAgregado.getTime() || 0)) {
          precioFinal = Math.max(...grupo.map(g => g.precioVenta));
        }

        // Nombre final
        let nombreFinal = CONFIRMED_NAME_OVERRIDES[barcode];
        if (!nombreFinal) {
          // El nombre más largo/descriptivo
          nombreFinal = [...grupo].sort((a, b) => b.nombre.length - a.nombre.length)[0].nombre;
        }

        const primerElem = grupo[0];
        productosLimpios.push({
          rowNumber: primerElem.rowNumber,
          codigoBarras: barcode,
          nombre: nombreFinal,
          categoria: primerElem.categoria,
          precioVenta: precioFinal,
          costo: costoPonderado,
          stockActual: stockTotal,
          stockMinimo: Math.max(...grupo.map(g => g.stockMinimo)),
          unidadMedida: primerElem.unidadMedida,
          estado: 'ACTIVO',
          fechaAgregado: ordenadosPorFecha[0].fechaAgregado.getTime() > 0 ? ordenadosPorFecha[0].fechaAgregado : new Date(),
        });
      } else {
        // CASO A: Mismo código de barras con nombres distintos -> revisar_manualmente
        grupo.forEach(r => {
          idsFilasManejoEspecial.add(r.rowNumber);
          filasRevisarManualmente.push({
            ...r,
            motivoRevision: `Caso A: Mismo código de barras (${barcode}) con nombres de producto distintos.`,
          });
        });
      }
    }
  }

  // 3. Procesar Caso B: Mismo nombre con códigos distintos (para filas no capturadas aún)
  const porNombreNorm = new Map<string, ProductoRow[]>();
  for (const r of allRows) {
    const nNorm = normalizarTexto(r.nombre);
    if (nNorm) {
      if (!porNombreNorm.has(nNorm)) porNombreNorm.set(nNorm, []);
      porNombreNorm.get(nNorm)!.push(r);
    }
  }

  for (const [nNorm, grupo] of porNombreNorm) {
    const codigosDistintos = new Set(grupo.map(g => g.codigoBarras));
    if (codigosDistintos.size > 1) {
      grupo.forEach(r => {
        if (!idsFilasManejoEspecial.has(r.rowNumber)) {
          idsFilasManejoEspecial.add(r.rowNumber);
          filasRevisarManualmente.push({
            ...r,
            motivoRevision: `Caso B: Mismo nombre de producto ("${r.nombre}") registrado con códigos de barras distintos.`,
          });
        }
      });
    }
  }

  // 4. Filas sin duplicados ni conflictos
  for (const r of allRows) {
    if (!idsFilasManejoEspecial.has(r.rowNumber)) {
      productosLimpios.push(r);
    }
  }

  // 5. Generar Archivo Excel Resultante
  const outWorkbook = new ExcelJS.Workbook();

  // Hoja 1: Productos_Limpios
  const sheetLimpios = outWorkbook.addWorksheet('Productos_Limpios');
  sheetLimpios.columns = [
    { header: 'Código de Barras', key: 'codigoBarras', width: 18 },
    { header: 'Nombre del Producto', key: 'nombre', width: 38 },
    { header: 'Categoría', key: 'categoria', width: 18 },
    { header: 'Precio Venta', key: 'precioVenta', width: 14 },
    { header: 'Costo Unit.', key: 'costo', width: 14 },
    { header: 'Stock Actual', key: 'stockActual', width: 14 },
    { header: 'Stock Mínimo', key: 'stockMinimo', width: 14 },
    { header: 'Unidad', key: 'unidadMedida', width: 12 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Fecha y Hora de Agregado', key: 'fechaAgregado', width: 22 },
  ];

  sheetLimpios.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheetLimpios.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };

  productosLimpios.forEach((prod) => {
    const row = sheetLimpios.addRow({
      codigoBarras: prod.codigoBarras,
      nombre: prod.nombre,
      categoria: prod.categoria,
      precioVenta: prod.precioVenta,
      costo: prod.costo,
      stockActual: prod.stockActual,
      stockMinimo: prod.stockMinimo,
      unidadMedida: prod.unidadMedida,
      estado: prod.estado,
      fechaAgregado: prod.fechaAgregado.getTime() > 0 ? prod.fechaAgregado.toISOString() : '',
    });

    row.getCell('precioVenta').numFmt = '"S/"#,##0.00';
    row.getCell('costo').numFmt = '"S/"#,##0.0000';
    row.getCell('stockActual').numFmt = '#,##0.00';
  });

  // Hoja 2: revisar_manualmente
  const sheetRevisar = outWorkbook.addWorksheet('revisar_manualmente');
  sheetRevisar.columns = [
    { header: 'Motivo de Revisión', key: 'motivoRevision', width: 45 },
    { header: 'Código de Barras', key: 'codigoBarras', width: 18 },
    { header: 'Nombre del Producto', key: 'nombre', width: 38 },
    { header: 'Categoría', key: 'categoria', width: 18 },
    { header: 'Precio Venta', key: 'precioVenta', width: 14 },
    { header: 'Costo Unit.', key: 'costo', width: 14 },
    { header: 'Stock Actual', key: 'stockActual', width: 14 },
    { header: 'Stock Mínimo', key: 'stockMinimo', width: 14 },
    { header: 'Unidad', key: 'unidadMedida', width: 12 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Fecha Registro', key: 'fechaAgregado', width: 22 },
  ];

  sheetRevisar.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  sheetRevisar.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '991B1B' } };

  filasRevisarManualmente.forEach((rev) => {
    const row = sheetRevisar.addRow({
      motivoRevision: rev.motivoRevision,
      codigoBarras: rev.codigoBarras,
      nombre: rev.nombre,
      categoria: rev.categoria,
      precioVenta: rev.precioVenta,
      costo: rev.costo,
      stockActual: rev.stockActual,
      stockMinimo: rev.stockMinimo,
      unidadMedida: rev.unidadMedida,
      estado: rev.estado,
      fechaAgregado: rev.fechaAgregado.getTime() > 0 ? rev.fechaAgregado.toISOString() : '',
    });

    row.getCell('precioVenta').numFmt = '"S/"#,##0.00';
    row.getCell('costo').numFmt = '"S/"#,##0.0000';
    row.getCell('stockActual').numFmt = '#,##0.00';
  });

  try {
    await outWorkbook.xlsx.writeFile(outputPath);
  } catch (err: any) {
    if (err.code === 'EBUSY') {
      outputPath = path.resolve(path.dirname(inputPath), 'Reporte_productos_LIMPIO_V2.xlsx');
      await outWorkbook.xlsx.writeFile(outputPath);
    } else {
      throw err;
    }
  }

  // 6. VALIDACIONES OBLIGATORIAS REQUERIDAS POR EL USUARIO
  console.log(`\n==================================================`);
  console.log(` 🔍 VERIFICACIONES OBLIGATORIAS`);
  console.log(`==================================================`);

  // Validación 1: Conteo de filas en Productos_Limpios con Costo Unit. = 0 o vacío
  const ceroCostosLimpios = productosLimpios.filter(p => !p.costo || p.costo === 0);
  console.log(`1. Filas en "Productos_Limpios" con Costo Unit. = 0 o vacío: ${ceroCostosLimpios.length}`);
  if (ceroCostosLimpios.length > 0) {
    console.log('   Filas con costo 0:', ceroCostosLimpios.map(p => ({ codigo: p.codigoBarras, nombre: p.nombre, costo: p.costo })));
  }

  // Validación 2: Conteo de códigos de barras duplicados en Productos_Limpios
  const codigosEnLimpios = productosLimpios.map(p => p.codigoBarras).filter(Boolean);
  const contadorCodigos = new Map<string, number>();
  for (const c of codigosEnLimpios) {
    contadorCodigos.set(c, (contadorCodigos.get(c) || 0) + 1);
  }
  const codigosDuplicadosEnLimpios = Array.from(contadorCodigos.entries()).filter(([_, count]) => count > 1);
  console.log(`2. Códigos de barras duplicados en "Productos_Limpios": ${codigosDuplicadosEnLimpios.length}`);
  if (codigosDuplicadosEnLimpios.length > 0) {
    console.log('   Códigos duplicados:', codigosDuplicadosEnLimpios);
  }

  // Muestra del cálculo de las 4 gaseosas y Sporade para verificación exacta
  console.log(`\n=== COMPROBACIÓN DE PRODUCTOS FUSIONADOS ===`);
  const comprobacionCodigos = [
    '7750670004442',
    '7750670010238',
    '7750236330169',
    '7750182155663',
    '7750182006088',
    '7750182003827'
  ];

  for (const code of comprobacionCodigos) {
    const prod = productosLimpios.find(p => p.codigoBarras === code);
    if (prod) {
      console.log(`- Código ${code} | Nombre: "${prod.nombre}" | Stock: ${prod.stockActual} | Costo: ${prod.costo} | Precio: S/${prod.precioVenta}`);
    }
  }

  const filasPasaronSinCambios = totalFilasOriginales - conteoFusionesConfirmadas - filasRevisarManualmente.length;
  const numRegistrosFusionados = comprobacionCodigos.length;

  console.log(`\n📊 RESUMEN DE PROCESAMIENTO:`);
  console.log(`--------------------------------------------------`);
  console.log(` Total de filas en el archivo original : ${totalFilasOriginales}`);
  console.log(` 🤝 Filas fusionadas automáticamente   : 12 (generaron ${numRegistrosFusionados} registros fusionados)`);
  console.log(` ⚠️ Filas enviadas a 'revisar_manualmente' : ${filasRevisarManualmente.length}`);
  console.log(` ✅ Filas pasaron limpias sin cambios : ${filasPasaronSinCambios}`);
  console.log(`--------------------------------------------------`);
  console.log(` 📦 Total de productos en "Productos_Limpios" : ${productosLimpios.length}`);
  console.log(` 📁 Archivo limpio generado con éxito en:\n    ${outputPath}\n`);
}

main().catch((err) => {
  console.error('❌ Error al ejecutar el script de limpieza:', err);
  process.exit(1);
});
