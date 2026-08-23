import ExcelJS from 'exceljs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

async function main() {
  const excelPath = path.resolve(__dirname, '../../INVENTARIO BASE DE ABARROTES (2).xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  const ws = workbook.worksheets[0];

  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  const rows: any[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rNum) => {
    if (rNum === 1) return;
    const vals = row.values as any[];
    const id = vals[1];
    if (!id || typeof id !== 'number') return;
    rows.push({
      rNum,
      id,
      producto: String(vals[3] || '').trim(),
      marca: String(vals[4] || '').trim(),
      desc: String(vals[5] || '').trim(),
      pres: String(vals[6] || '').trim(),
      cant: Number(vals[7] || 0),
      fecha: vals[15]
    });
  });

  const productosDb = await prisma.producto.findMany();
  const ventaDetalles = await prisma.ventaDetalle.findMany({
    include: { venta: true, producto: true }
  });

  // 17 productos nuevos desde Fila 180 (ID 178)
  const lote180 = rows.filter(r => r.rNum >= 180);
  const filasPrevias = rows.filter(r => r.rNum < 180);

  console.log(`\n========================================================================================================`);
  console.log(`AUDITORÍA COMPLETA: 17 PRODUCTOS DEL LOTE 22 (INGRESOS PREVIOS EN EXCEL VS VENTAS EN BD)`);
  console.log(`========================================================================================================\n`);

  const reporteFinal: any[] = [];

  for (const item of lote180) {
    const nombreLote = `${item.producto} ${item.marca} ${item.desc} ${item.pres}`.replace(/\s+/g, ' ').trim();

    // Buscar en filas previas (< 180) coincidencias exactas o de mismo producto y presentación
    const coincidentesExcel = filasPrevias.filter(p => {
      // Comparar producto + marca + presentación
      const norm1 = `${p.producto} ${p.marca} ${p.pres}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      const norm2 = `${item.producto} ${item.marca} ${item.pres}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm1 === norm2) return true;
      
      // Casos específicos:
      if (item.producto.includes('PAN') && p.producto.includes('PAN SERRANO')) return true;
      if (item.producto.includes('LECHE') && item.marca.includes('GLORIA') && item.pres.includes('390') &&
          p.producto.includes('LECHE') && p.marca.includes('GLORIA') && p.pres.includes('390')) return true;
      if (item.producto.includes('AGUA') && item.marca.includes('SAN CARLOS') && item.pres.includes('500') &&
          p.producto.includes('AGUA') && p.marca.includes('SAN CARLOS') && p.pres.includes('500')) return true;
      if (item.producto.includes('PAPEL') && item.marca.includes('NOBLE') && item.pres.includes('PQ4') &&
          p.producto.includes('PAPEL') && p.marca.includes('NOBLE') && p.pres.includes('PQ4')) return true;
      if (item.producto.includes('DETERGENTE') && item.marca.includes('TROME') && (item.pres.includes('1K') || item.pres.includes('1 K')) &&
          p.producto.includes('DETERGENTE') && p.marca.includes('TROME') && (p.pres.includes('1K') || p.pres.includes('1 K') || p.desc.includes('1 kg'))) return true;
      if (item.producto.includes('PORTOLITA') && p.producto.includes('PORTOLITA')) return true;
      if (item.producto.includes('BISCOCHOS') && p.producto.includes('BISCOCHOS')) return true;
      if (item.producto.includes('FLAN') && p.producto.includes('FLAN')) return true;

      return false;
    });

    let sumaIngresosExcelPrevios = 0;
    const desgloseIngresosPrevios: string[] = [];
    coincidentesExcel.forEach(c => {
      sumaIngresosExcelPrevios += c.cant;
      desgloseIngresosPrevios.push(`Fila ${c.rNum} (${c.cant} unid, Fecha: ${c.fecha ? new Date(c.fecha).toLocaleDateString('es-PE') : 'Sin fecha'})`);
    });

    // Buscar en la BD el producto exacto
    const prodDb = productosDb.find(pdb => {
      const pdbNorm = pdb.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
      const itemNorm = nombreLote.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (pdbNorm.includes(itemNorm) || itemNorm.includes(pdbNorm)) return true;

      // Coincidencias específicas
      if (nombreLote.includes('NOBLE') && pdb.nombre.includes('NOBLE PQ4')) return true;
      if (nombreLote.includes('SAN CARLOS') && pdb.nombre.includes('SAN CARLOS 500ML')) return true;
      if (nombreLote.includes('LECHE') && nombreLote.includes('GLORIA') && pdb.nombre.includes('LECHE EVAPORADA GLORIA 390')) return true;
      if (nombreLote.includes('TROME') && (nombreLote.includes('1KL') || nombreLote.includes('1KG')) && pdb.nombre.includes('TROME 1KG')) return true;
      if (nombreLote.includes('PORTOLITA') && pdb.nombre.includes('PORTOLITA')) return true;
      if (nombreLote.includes('PAN SERRANO') && pdb.nombre.includes('PAN PAN SERRANO')) return true;
      if (nombreLote.includes('BISCOCHOS') && pdb.nombre.includes('BISCOCHOS')) return true;
      if (nombreLote.includes('FLAN') && pdb.nombre.includes('FLAN')) return true;
      return false;
    });

    let totalVendidoEnCaja = 0;
    if (prodDb) {
      const veds = ventaDetalles.filter(v => v.productoId === prodDb.id);
      veds.forEach(v => totalVendidoEnCaja += Number(v.cantidad));
    }

    const stockQueQuedaba = sumaIngresosExcelPrevios - totalVendidoEnCaja;
    const nuevoIngreso = item.cant;
    const stockRealFinal = stockQueQuedaba + nuevoIngreso;

    reporteFinal.push({
      filaExcel: item.rNum,
      idExcel: item.id,
      nombreExcel: nombreLote,
      nombreBd: prodDb ? prodDb.nombre : '(Nuevo en BD)',
      ingresosPreviosExcel: sumaIngresosExcelPrevios,
      desgloseExcel: desgloseIngresosPrevios.join('; ') || 'Ninguno',
      ventasEnCaja: totalVendidoEnCaja,
      stockQueQuedaba,
      nuevoIngreso,
      stockRealFinal
    });
  }

  console.table(reporteFinal.map(r => ({
    'Fila': r.filaExcel,
    'Producto': r.nombreExcel,
    'Ingresado Ant. (Excel)': r.ingresosPreviosExcel,
    'Vendido (Caja)': r.ventasEnCaja,
    'Quedaba Antes': r.stockQueQuedaba,
    '+ Nuevo (22-Ago)': r.nuevoIngreso,
    'STOCK REAL': r.stockRealFinal
  })));

  await prisma.$disconnect();
}

main().catch(console.error);
