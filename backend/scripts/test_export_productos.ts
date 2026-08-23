import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { excelService } from '../src/common/services/excel.service';

async function testExportProductos() {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  console.log('Generando archivo de prueba de catálogo/plantilla de productos...');

  const productos = await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: [
      { categoria: { nombre: 'asc' } },
      { nombre: 'asc' },
    ],
  });

  const fechaHoy = new Date();

  const datosFormateados = productos.map((p, idx) => ({
    correlativo: idx + 1,
    codigoBarras: p.codigoBarras && !p.codigoBarras.startsWith('SC-') ? p.codigoBarras : '',
    categoria: p.categoria?.nombre || 'ABARROTES',
    nombre: p.nombre,
    stockActual: Number(p.stockActual),
    unidadMedida: p.unidadMedida || 'UNID.',
    costo: Number(p.costo),
    precioVenta: Number(p.precioVenta),
    fechaRegistro: fechaHoy,
    tienda: '',
  }));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Minimarket POS';

  excelService.construirHoja(workbook, {
    nombreHoja: 'base de pedidos',
    titulo: 'Catálogo de Inventario y Pedidos de Productos',
    subtitulo: 'Plantilla compatible para registro de compras, actualización de costos y carga de inventario',
    mostrarTotales: true,
    columnas: [
      { header: 'ID', key: 'correlativo', width: 8, tipo: 'entero', alineacion: 'center' },
      { header: 'COD. DE BARRAS', key: 'codigoBarras', width: 18, tipo: 'texto', alineacion: 'center' },
      { header: 'CATEGORÍA', key: 'categoria', width: 20, tipo: 'texto' },
      { header: 'PRODUCTO', key: 'nombre', width: 40, tipo: 'texto' },
      { header: 'CANT.', key: 'stockActual', width: 12, tipo: 'cantidad', esTotalizable: true },
      { header: 'UNID. MEDIDA', key: 'unidadMedida', width: 15, tipo: 'texto', alineacion: 'center' },
      { header: 'PRECIO UNITARIO', key: 'costo', width: 18, tipo: 'moneda' },
      { header: 'PRECIO VENTA', key: 'precioVenta', width: 16, tipo: 'moneda' },
      { header: 'FECHA DE REGISTRO', key: 'fechaRegistro', width: 18, tipo: 'fecha' },
      { header: 'TIENDA', key: 'tienda', width: 25, tipo: 'texto' },
    ],
    datos: datosFormateados,
  });

  const outDir = path.resolve(__dirname, '../scratch');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'test_plantilla_productos.xlsx');
  await workbook.xlsx.writeFile(outPath);

  console.log(`Archivo generado con éxito en: ${outPath}`);
  console.log(`Total productos exportados: ${datosFormateados.length}`);

  await prisma.$disconnect();
}

testExportProductos().catch(console.error);
