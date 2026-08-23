import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { excelService } from '../src/common/services/excel.service';

async function testExport() {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  console.log('Generando archivo de prueba con agrupación y combinación...');

  const ventas = await prisma.venta.findMany({
    include: {
      usuario: true,
      cliente: true,
      detalles: {
        include: {
          producto: {
            include: {
              categoria: true,
            },
          },
        },
      },
    },
    orderBy: { fecha: 'desc' },
    take: 50,
  });

  const datosResumen = ventas.map((v) => ({
    codigo: v.id.substring(0, 8).toUpperCase(),
    fecha: v.fecha,
    cajero: v.usuario?.nombre || 'N/A',
    cliente: v.cliente?.nombre || 'Público General',
    metodoPago: v.metodoPago,
    total: Number(v.total),
    estado: v.estado,
  }));

  const datosDetalle: any[] = [];
  for (const v of ventas) {
    const codigoVenta = v.id.substring(0, 8).toUpperCase();
    for (const d of v.detalles) {
      datosDetalle.push({
        codigoVenta,
        fecha: v.fecha,
        codigoBarras: d.producto?.codigoBarras || 'N/A',
        producto: d.producto?.nombre || 'Producto no identificado',
        categoria: d.producto?.categoria?.nombre || 'GENERAL',
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precioUnitario),
        subtotal: Number(d.subtotal),
        metodoPago: v.metodoPago,
        cajero: v.usuario?.nombre || 'N/A',
      });
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Minimarket POS';

  excelService.construirHoja(workbook, {
    nombreHoja: 'Resumen de Ventas',
    titulo: 'Historial General de Ventas',
    subtitulo: 'Consolidado de transacciones realizadas en el sistema POS',
    mostrarTotales: true,
    columnas: [
      { header: 'ID Venta', key: 'codigo', width: 14, tipo: 'texto', alineacion: 'center' },
      { header: 'Fecha y Hora', key: 'fecha', width: 18, tipo: 'fecha' },
      { header: 'Cajero / Usuario', key: 'cajero', width: 22, tipo: 'texto' },
      { header: 'Cliente', key: 'cliente', width: 25, tipo: 'texto' },
      { header: 'Método Pago', key: 'metodoPago', width: 16, tipo: 'texto', alineacion: 'center' },
      { header: 'Total Venta', key: 'total', width: 16, tipo: 'moneda', esTotalizable: true },
      { header: 'Estado', key: 'estado', width: 14, tipo: 'estado' },
    ],
    datos: datosResumen,
  });

  excelService.construirHoja(workbook, {
    nombreHoja: 'Detalle de Productos',
    titulo: 'Detalle de Productos Vendidos',
    subtitulo: 'Desglose por producto vendido, cantidades, precios y subtotales por venta',
    mostrarTotales: true,
    columnaAgrupacion: 'codigoVenta',
    columnasACombinar: ['codigoVenta', 'fecha', 'metodoPago', 'cajero'],
    columnas: [
      { header: 'ID Venta', key: 'codigoVenta', width: 14, tipo: 'texto', alineacion: 'center' },
      { header: 'Fecha y Hora', key: 'fecha', width: 18, tipo: 'fecha' },
      { header: 'Cód. Barras', key: 'codigoBarras', width: 16, tipo: 'texto', alineacion: 'center' },
      { header: 'Producto', key: 'producto', width: 35, tipo: 'texto' },
      { header: 'Categoría', key: 'categoria', width: 20, tipo: 'texto' },
      { header: 'Cant.', key: 'cantidad', width: 10, tipo: 'numero', esTotalizable: true },
      { header: 'P. Unitario', key: 'precioUnitario', width: 14, tipo: 'moneda' },
      { header: 'Subtotal', key: 'subtotal', width: 16, tipo: 'moneda', esTotalizable: true },
      { header: 'Método Pago', key: 'metodoPago', width: 15, tipo: 'texto', alineacion: 'center' },
      { header: 'Cajero', key: 'cajero', width: 20, tipo: 'texto' },
    ],
    datos: datosDetalle,
  });

  const outDir = path.resolve(__dirname, '../scratch');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'test_reporte_ventas_agrupado.xlsx');
  await workbook.xlsx.writeFile(outPath);

  console.log(`Archivo generado con éxito en: ${outPath}`);
  console.log(`Hojas: ${workbook.worksheets.map(w => w.name).join(', ')}`);

  await prisma.$disconnect();
}

testExport().catch(console.error);
