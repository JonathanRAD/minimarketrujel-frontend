import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { prisma } from '../src/config/prisma';

async function listAll32New() {
  console.log('=== LISTA COMPLETA Y AUDITORÍA EXPLICATIVA DE LOS 32 PRODUCTOS ===\n');

  // 1. Obtener productos de DB
  const productosDb = await prisma.producto.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const originales174 = productosDb.slice(0, 174);
  const nuevos32 = productosDb.slice(174);

  // 2. Cargar Excel
  const rootDir = path.join(__dirname, '..', '..');
  const excelPath = path.join(rootDir, 'INVENTARIO BASE DE ABARROTES - copia.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  const sheet = workbook.worksheets[0];

  const listaCompleta: Array<{
    N: number;
    'Fila Excel': number;
    'Código Barras': string;
    'Nombre en Excel / BD': string;
    'Fecha Excel': string;
    'Tienda / Origen': string;
    'Precio Venta': string;
    'Costo Unit.': string;
    Stock: string;
  }> = [];

  for (let i = 0; i < nuevos32.length; i++) {
    const p = nuevos32[i];

    let filaExcel = -1;
    let fechaExcel = '';
    let tiendaExcel = '';

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const getStr = (col: number) => {
        const v = row.getCell(col).value;
        return v ? String(v).trim() : '';
      };
      const codStr = getStr(3); // col C: COD DE BARRAS
      const prodStr = getStr(4); // col D: PRODUCTO

      if ((p.codigoBarras && codStr === p.codigoBarras) || (prodStr && p.nombre.toUpperCase().includes(prodStr.toUpperCase()))) {
        if (filaExcel === -1) {
          filaExcel = rowNumber;
          fechaExcel = getStr(14); // col N: FECHA DE REGISTRO
          tiendaExcel = getStr(15); // col O: TIENDA
        }
      }
    });

    listaCompleta.push({
      N: i + 1,
      'Fila Excel': filaExcel,
      'Código Barras': p.codigoBarras,
      'Nombre en Excel / BD': p.nombre,
      'Fecha Excel': fechaExcel || 'Sin fecha',
      'Tienda / Origen': tiendaExcel || 'Sin tienda',
      'Precio Venta': `S/ ${p.precioVenta.toString()}`,
      'Costo Unit.': `S/ ${p.costo.toString()}`,
      Stock: `${p.stockActual.toString()} ${p.unidadMedida}`,
    });
  }

  console.table(listaCompleta);
}

listAll32New()
  .then(() => process.exit(0))
  .catch(console.error);
