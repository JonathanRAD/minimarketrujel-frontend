import ExcelJS from 'exceljs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

async function main() {
  const excelPath = path.resolve(__dirname, '../../INVENTARIO BASE DE ABARROTES (2).xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  const ws = workbook.worksheets[0];
  console.log(`=== ANALIZANDO TODAS LAS FILAS DE EXCEL ("${ws.name}") ===`);

  const rows: any[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // headers
    const vals = row.values as any[];
    // vals is 1-indexed (vals[0] is undefined/null)
    rows.push({
      rowNumber,
      id: vals[1],
      codigo: vals[2],
      producto: vals[3],
      marca: vals[4],
      descripcion: vals[5],
      presentacion: vals[6],
      cant: vals[7],
      col8: vals[8],
      unid: vals[9],
      precio: vals[10],
      precioUnit: vals[11],
      col12: vals[12],
      precioVenta: vals[13],
      promociones: vals[14],
      fechaRegistro: vals[15],
      tienda: vals[16],
      raw: vals
    });
  });

  console.log(`Total filas de datos encontradas: ${rows.length}`);

  // Mostrar resumen de fechas presentes en el Excel
  const fechasSet = new Set<string>();
  rows.forEach(r => {
    fechasSet.add(String(r.fechaRegistro || 'SIN_FECHA'));
  });
  console.log('\nFechas encontradas en la columna FECHA DE REGISTRO:');
  console.log(Array.from(fechasSet));

  // Imprimir filas donde fechaRegistro tiene "22" o "23" o filas relevantes
  console.log('\n--- MUESTRA DE FILAS CON SUS FECHAS Y PRODUCTOS ---');
  rows.forEach(r => {
    const pNombre = [r.producto, r.marca, r.descripcion, r.presentacion].filter(Boolean).join(' ');
    console.log(`Fila ${r.rowNumber} | ID: ${r.id} | Fecha: ${r.fechaRegistro} | Cant: ${r.cant} | Col8: ${r.col8} | Prod: "${pNombre}"`);
  });

  // Conectar a Supabase para analizar todas las ventas por producto
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  const productosDb = await prisma.producto.findMany();
  const ventaDetalles = await prisma.ventaDetalle.findMany({
    include: { venta: true, producto: true }
  });

  console.log(`\n=== PRODUCTOS EN BD (${productosDb.length}) Y VENTAS TOTALES (${ventaDetalles.length}) ===`);
  
  // Agrupar ventas por productoId
  const ventasPorProducto = new Map<string, { cantidadTotal: number; ventas: any[] }>();
  for (const vd of ventaDetalles) {
    if (!ventasPorProducto.has(vd.productoId)) {
      ventasPorProducto.set(vd.productoId, { cantidadTotal: 0, ventas: [] });
    }
    const data = ventasPorProducto.get(vd.productoId)!;
    data.cantidadTotal += Number(vd.cantidad);
    data.ventas.push(vd);
  }

  // Comparar cada producto en DB con sus ventas
  console.log('\n--- RESUMEN DE VENTAS POR PRODUCTO EN BD ---');
  for (const p of productosDb) {
    const vInfo = ventasPorProducto.get(p.id) || { cantidadTotal: 0, ventas: [] };
    if (vInfo.cantidadTotal > 0) {
      console.log(`Prod: "${p.nombre}" | Stock Actual en BD: ${p.stockActual} | Total Unidades Vendidas: ${vInfo.cantidadTotal}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
