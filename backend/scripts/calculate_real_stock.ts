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

  // 1. Extraer todas las filas del Excel agrupadas por producto
  const excelRows: any[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rNum) => {
    if (rNum === 1) return;
    const vals = row.values as any[];
    const id = vals[1];
    if (!id || typeof id !== 'number') return;

    const producto = String(vals[3] || '').trim();
    const marca = String(vals[4] || '').trim();
    const desc = String(vals[5] || '').trim();
    const pres = String(vals[6] || '').trim();
    const cant = Number(vals[7] || 0);
    const fecha = vals[15];

    excelRows.push({
      rNum,
      id,
      producto,
      marca,
      desc,
      pres,
      nombreCompleto: [producto, marca, desc, pres].filter(Boolean).join(' '),
      cant,
      fecha,
      esLote22: rNum >= 180
    });
  });

  console.log(`Total filas válidas en Excel: ${excelRows.length}`);
  console.log(`Filas previas (< 180): ${excelRows.filter(r => !r.esLote22).length}`);
  console.log(`Filas lote 22 (>= 180): ${excelRows.filter(r => r.esLote22).length}\n`);

  // 2. Traer todos los productos y todas las ventas de la BD
  const productosDb = await prisma.producto.findMany();
  const ventasDetalles = await prisma.ventaDetalle.findMany({
    include: { venta: true, producto: true }
  });

  // Agrupar ventas por productoId
  const ventasMap = new Map<string, { totalVendidas: number; detalles: any[] }>();
  for (const vd of ventasDetalles) {
    if (!ventasMap.has(vd.productoId)) {
      ventasMap.set(vd.productoId, { totalVendidas: 0, detalles: [] });
    }
    const d = ventasMap.get(vd.productoId)!;
    d.totalVendidas += Number(vd.cantidad);
    d.detalles.push(vd);
  }

  // 3. Analizar los 17 productos del lote nuevo (>= 180) y cómo aparecían antes en el Excel
  const loteNuevo = excelRows.filter(r => r.esLote22);

  console.log(`====================================================================================================`);
  console.log(`ANÁLISIS COMPLETO: INGRESOS HISTÓRICOS EN EXCEL VS VENTAS REGISTRADAS`);
  console.log(`====================================================================================================\n`);

  for (const itemNuevo of loteNuevo) {
    console.log(`----------------------------------------------------------------------------------------------------`);
    console.log(`PRODUCTO EN LOTE 22 (Fila ${itemNuevo.rNum} | ID ${itemNuevo.id}): "${itemNuevo.nombreCompleto}"`);
    console.log(`  -> Cantidad en este nuevo ingreso (22-Ago): +${itemNuevo.cant}`);

    // Buscar si este producto estaba en las filas anteriores del Excel (< 180)
    const ingresosPreviosExcel = excelRows.filter(r => 
      !r.esLote22 && 
      (
        r.nombreCompleto.toLowerCase().includes(itemNuevo.producto.toLowerCase()) &&
        (itemNuevo.marca ? r.nombreCompleto.toLowerCase().includes(itemNuevo.marca.toLowerCase()) : true)
      )
    );

    let totalIngresadoPrevioExcel = 0;
    if (ingresosPreviosExcel.length > 0) {
      console.log(`  -> Ingresos PREVIOS encontrados en Excel:`);
      for (const ip of ingresosPreviosExcel) {
        console.log(`     * Fila ${ip.rNum} (ID ${ip.id}) | Cant: ${ip.cant} | Fecha: ${ip.fecha} | "${ip.nombreCompleto}"`);
        totalIngresadoPrevioExcel += ip.cant;
      }
    } else {
      console.log(`  -> Ingresos PREVIOS en Excel: NINGUNO (Es un producto 100% nuevo en el catálogo)`);
    }

    // Buscar coincidencia en la Base de Datos
    const prodDb = productosDb.find(p => 
      p.nombre.toLowerCase().includes(itemNuevo.producto.toLowerCase()) &&
      (itemNuevo.marca ? p.nombre.toLowerCase().includes(itemNuevo.marca.toLowerCase()) : true)
    );

    let totalVentasDb = 0;
    if (prodDb) {
      const vInfo = ventasMap.get(prodDb.id);
      totalVentasDb = vInfo ? vInfo.totalVendidas : 0;
      console.log(`  -> Coincidencia en BD: [${prodDb.id}] "${prodDb.nombre}"`);
      console.log(`     * Total Ventas Registradas en Caja: ${totalVentasDb}`);
    } else {
      console.log(`  -> No existía previamente en la Base de Datos.`);
    }

    // CÁLCULO DE BALANCE REAL:
    // Stock real antes del lote 22 = Total Ingresado Previo Excel - Total Ventas
    const stockRealPrevio = totalIngresadoPrevioExcel - totalVentasDb;
    const stockRealFinal = stockRealPrevio + itemNuevo.cant;

    console.log(`  ==> BALANCE CALCULADO:`);
    console.log(`      Ingresos Previos (${totalIngresadoPrevioExcel}) - Ventas (${totalVentasDb}) = Stock que quedaba: ${stockRealPrevio}`);
    console.log(`      Stock que quedaba (${stockRealPrevio}) + Nuevo Ingreso (${itemNuevo.cant}) = STOCK FINAL REAL: ${stockRealFinal}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
