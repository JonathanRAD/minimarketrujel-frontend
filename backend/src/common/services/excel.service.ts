import { Response } from 'express';
import ExcelJS from 'exceljs';

export interface ColumnaExcel {
  header: string;
  key: string;
  width?: number;
  tipo?: 'texto' | 'moneda' | 'numero' | 'entero' | 'fecha' | 'booleano' | 'estado';
  alineacion?: 'left' | 'center' | 'right';
  esTotalizable?: boolean;
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

export class ExcelService {
  /**
   * Genera y transmite un reporte Excel profesional directamente en la respuesta HTTP Express.
   */
  async generarYEnviarReporte(res: Response, opciones: OpcionesReporteExcel): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Minimarket POS';
    workbook.created = new Date();

    const nombreHoja = opciones.nombreHoja || 'Reporte';
    const worksheet = workbook.addWorksheet(nombreHoja, {
      views: [{ showGridLines: true }],
    });

    const colsCount = opciones.columnas.length;
    const endColLetter = this.obtenerLetraColumna(colsCount);

    // ==========================================
    // 1. BANNER DE TÍTULO Y ENCABEZADO
    // ==========================================
    worksheet.addRow([]);
    worksheet.getRow(1).height = 10;

    worksheet.mergeCells(`A2:${endColLetter}2`);
    const cellTitulo = worksheet.getCell('A2');
    cellTitulo.value = `MINIMARKET - ${opciones.titulo.toUpperCase()}`;
    cellTitulo.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    cellTitulo.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' },
    };
    cellTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 36;

    if (opciones.subtitulo) {
      worksheet.mergeCells(`A3:${endColLetter}3`);
      const cellSub = worksheet.getCell('A3');
      cellSub.value = opciones.subtitulo;
      cellSub.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'F8FAFC' } };
      cellSub.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' },
      };
      cellSub.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(3).height = 24;
    }

    const filaMetaNum = opciones.subtitulo ? 4 : 3;
    worksheet.mergeCells(`A${filaMetaNum}:${endColLetter}${filaMetaNum}`);
    const cellMeta = worksheet.getCell(`A${filaMetaNum}`);
    const fechaHora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    cellMeta.value = `Fecha de emisión: ${fechaHora}  |  Total registros: ${opciones.datos.length}`;
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
    const headerRowValues = opciones.columnas.map((c) => c.header);
    const headerRow = worksheet.addRow(headerRowValues);
    headerRow.height = 28;

    headerRow.eachCell((cell, colIndex) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' },
      };
      const colDef = opciones.columnas[colIndex - 1];
      const esNumerico = colDef?.tipo === 'moneda' || colDef?.tipo === 'numero' || colDef?.tipo === 'entero';
      const align = colDef?.alineacion || (esNumerico ? 'right' : (colDef?.tipo === 'fecha' || colDef?.tipo === 'booleano' || colDef?.tipo === 'estado' ? 'center' : 'left'));

      cell.alignment = { horizontal: align, vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: '1D4ED8' } },
        bottom: { style: 'medium', color: { argb: '1D4ED8' } },
        left: { style: 'thin', color: { argb: '60A5FA' } },
        right: { style: 'thin', color: { argb: '60A5FA' } },
      };
    });

    worksheet.autoFilter = {
      from: { row: filaHeaderNum, column: 1 },
      to: { row: filaHeaderNum, column: colsCount },
    };

    // ==========================================
    // 3. DATOS Y FORMATO DE FILAS (EFECTO CEBRA)
    // ==========================================
    const startDataRow = filaHeaderNum + 1;

    opciones.datos.forEach((item, index) => {
      const rowValues = opciones.columnas.map((col) => {
        const val = item[col.key];
        if (val === undefined || val === null) return '';
        if (col.tipo === 'fecha' && val) {
          return new Date(val);
        }
        if (col.tipo === 'moneda' || col.tipo === 'numero' || col.tipo === 'entero') {
          return Number(val) || 0;
        }
        if (col.tipo === 'booleano') {
          return val ? 'SÍ' : 'NO';
        }
        return val;
      });

      const row = worksheet.addRow(rowValues);
      row.height = 22;

      const isEven = index % 2 === 0;
      const bgArgb = isEven ? 'FFFFFF' : 'F8FAFC';

      row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        const colDef = opciones.columnas[colIndex - 1];
        if (!colDef) return;

        if (colDef.tipo === 'moneda') {
          cell.numFmt = '"S/" #,##0.00;[Red]-"S/" #,##0.00;"S/" 0.00';
        } else if (colDef.tipo === 'numero') {
          cell.numFmt = '#,##0.00';
        } else if (colDef.tipo === 'entero') {
          cell.numFmt = '#,##0'; // Formato de entero sin decimales
        } else if (colDef.tipo === 'fecha' && cell.value instanceof Date) {
          cell.numFmt = 'DD/MM/YYYY HH:mm';
        }

        const esNumerico = colDef.tipo === 'moneda' || colDef.tipo === 'numero' || colDef.tipo === 'entero';
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

        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
      });
    });

    // ==========================================
    // 4. FILA DE TOTALES
    // ==========================================
    if (opciones.mostrarTotales && opciones.datos.length > 0) {
      const totalsValues: any[] = [];

      opciones.columnas.forEach((col, idx) => {
        if (idx === 0) {
          totalsValues.push('TOTALES GENERALES');
        } else if (col.esTotalizable) {
          const suma = opciones.datos.reduce((acc, curr) => acc + (Number(curr[col.key]) || 0), 0);
          totalsValues.push(suma);
        } else {
          totalsValues.push('');
        }
      });

      const totalRow = worksheet.addRow(totalsValues);
      totalRow.height = 26;

      totalRow.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        const colDef = opciones.columnas[colIndex - 1];
        if (!colDef) return;

        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E2E8F0' },
        };

        if (colDef.tipo === 'moneda') {
          cell.numFmt = '"S/" #,##0.00';
        } else if (colDef.tipo === 'numero') {
          cell.numFmt = '#,##0.00';
        } else if (colDef.tipo === 'entero') {
          cell.numFmt = '#,##0';
        }

        const esNumerico = colDef.tipo === 'moneda' || colDef.tipo === 'numero' || colDef.tipo === 'entero';
        const align = colIndex === 1 ? 'left' : colDef.alineacion || (esNumerico ? 'right' : 'center');
        cell.alignment = { horizontal: align, vertical: 'middle' };

        cell.border = {
          top: { style: 'thin', color: { argb: '475569' } },
          bottom: { style: 'double', color: { argb: '0F172A' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } },
        };
      });
    }

    // ==========================================
    // 5. AJUSTE DINÁMICO DE ANCHO DE COLUMNAS
    // ==========================================
    opciones.columnas.forEach((col, idx) => {
      const colNumber = idx + 1;
      let maxLen = col.header.length;

      opciones.datos.forEach((item) => {
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

    // ==========================================
    // 6. ENVIAR A EXPRESS RESPONSE STREAM
    // ==========================================
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${opciones.nombreArchivo}"`);

    await workbook.xlsx.write(res);
    res.end();
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
