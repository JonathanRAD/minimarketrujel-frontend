import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const excelPath = path.resolve(__dirname, '../../INVENTARIO BASE DE ABARROTES (2).xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  for (const ws of workbook.worksheets) {
    console.log(`\n======================================================`);
    console.log(`HOJA: "${ws.name}" (Filas: ${ws.rowCount})`);
    console.log(`======================================================`);

    const headers = (ws.getRow(1).values as any[]).slice(1);
    console.log('Encabezados:', headers);

    ws.eachRow({ includeEmpty: false }, (row, rNum) => {
      if (rNum === 1) return;
      const vals = row.values as any[];
      // vals[1]: ID, vals[2]: Cod, vals[3]: Producto, vals[4]: Marca, vals[5]: Desc, vals[6]: Pres, vals[7]: Cant, vals[8]: Col8, vals[15]: Fecha, vals[16]: Tienda
      const nombre = [vals[3], vals[4], vals[5], vals[6]].filter(Boolean).join(' ');
      const fecha = vals[15];
      const cant = vals[7];
      const col8 = vals[8];
      const precioVenta = vals[13];
      const tienda = vals[16];
      console.log(`Fila ${String(rNum).padStart(3)} | ID: ${String(vals[1]).padStart(3)} | Cant: ${String(cant).padStart(3)} | Col8: ${String(col8).padStart(3)} | Fecha: ${String(fecha).padEnd(12)} | "${nombre}"`);
    });
  }
}

main().catch(console.error);
