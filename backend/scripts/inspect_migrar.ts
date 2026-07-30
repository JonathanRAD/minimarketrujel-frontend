import ExcelJS from 'exceljs';
import path from 'path';

async function inspectToMigrate() {
  const filePath = path.resolve(__dirname, '../../Productos_a_Migrar.xlsx');
  console.log('Reading file:', filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log('Sheets found:', workbook.worksheets.map(w => w.name));

  for (const sheet of workbook.worksheets) {
    console.log(`\nSheet "${sheet.name}" row count:`, sheet.rowCount);
    sheet.eachRow((row, rNum) => {
      if (rNum <= 10 || rNum > sheet.rowCount - 5) {
        console.log(` Row ${rNum}:`, row.values);
      }
    });
  }
}

inspectToMigrate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
