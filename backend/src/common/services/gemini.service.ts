import { GoogleGenerativeAI } from '@google/generative-ai';

export interface RespostaCoincidenciaIA {
  productoId: string;
  nombreCoincidente: string;
  confianza: number;
  explicacion: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /** Indica si la integración con Gemini IA está activa y configurada */
  public isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY && !!this.genAI;
  }

  /**
   * Consulta a Google Gemini AI para determinar si un producto del Excel
   * coincide semánticamente con alguno de los candidatos existentes en la BD.
   */
  public async buscarCoincidenciaProducto(
    nombreExcel: string,
    candidatos: Array<{ id: string; nombre: string; codigoBarras?: string }>
  ): Promise<RespostaCoincidenciaIA | null> {
    if (!this.isConfigured() || !this.genAI || candidatos.length === 0) {
      return null;
    }

    try {
      // Usar modelo rápido y gratuito gemini-1.5-flash
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
Eres un asistente de inventario experto de minimarket.
Analiza si el producto entrante del archivo Excel corresponde a alguno de los productos existentes en el catálogo de la tienda.

Producto entrante (Excel): "${nombreExcel}"

Candidatos en Catálogo BD:
${JSON.stringify(candidatos.slice(0, 20), null, 2)}

Instrucciones:
1. Compara marcas, volúmenes (ML, L, KG, GR), sabores y nombres equivalentes.
2. Si el contenido/volumen es claramente diferente (ej: 900ml vs 500ml), NO es coincidencia.
3. Responde únicamente en formato JSON con la siguiente estructura:
{
  "coincide": true | false,
  "productoId": "string con el ID de la BD o null si no coincide",
  "nombreCoincidente": "nombre del producto en BD o null",
  "confianza": número entre 0.0 y 1.0,
  "explicacion": "breve razón en español de 1 línea"
}
`;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const json = JSON.parse(textResponse);

      if (json.coincide && json.productoId && json.confianza >= 0.75) {
        return {
          productoId: json.productoId,
          nombreCoincidente: json.nombreCoincidente || '',
          confianza: json.confianza,
          explicacion: json.explicacion || 'Coincidencia confirmada por IA Gemini',
        };
      }

      return null;
    } catch (error) {
      console.warn('Advertencia Gemini AI (fallback a coincidencia algorítmica):', error);
      return null;
    }
  }

  /**
   * Analiza con Google Gemini AI la fila de encabezados de un Excel para mapear inteligentemente
   * qué columna corresponde a cada campo del sistema (código, nombre, costo, precio venta, etc.)
   */
  public async detectarMapeoColumnas(
    headers: string[]
  ): Promise<{ [key: string]: number } | null> {
    if (!this.isConfigured() || !this.genAI || headers.length === 0) {
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const headersFormatted = headers.map((h, i) => ({ colIdx: i + 1, headerText: h }));

      const prompt = `
Eres un asistente experto en procesamiento de archivos Excel de inventarios de minimarket.
Analiza la siguiente lista de encabezados de columnas de un archivo Excel (índice colIdx 1-based):

${JSON.stringify(headersFormatted, null, 2)}

Identifica la columna (colIdx 1-based) exacta que corresponde a cada campo del sistema:
- "codigo": Código de barras (ej: COD. DE BARRAS, CODIGO, EAN, SKU, BARRAS)
- "nombre": Nombre principal del producto (ej: PRODUCTO, NOMBRE, ITEM)
- "marca": Marca (ej: MARCA, FABRICANTE)
- "detalle": Descripción adicional o variedad (ej: DESCRIPCIÓN, DETALLE, VARIEDAD)
- "tamano": Presentación o tamaño (ej: PRESENTACIÓN, TAMAÑO, CONTENIDO)
- "stock": Cantidad o stock (ej: CANT., CANTIDAD, STOCK, EXISTENCIAS)
- "unidad": Unidad de medida (ej: UNID. MEDIDA, UNIDAD, U.M.)
- "costo": Precio de costo unitario por producto (ej: PRECIO UNITARIO, P.UNITARIO, COSTO, COSTO UNITARIO, PRECIO COMPRA, P.COMPRA)
- "precioVenta": Precio de venta al público por producto (ej: PRECIO VENTA, P.VENTA, PVP, PRECIO DE VENTA)
- "precioPaquete": Precio total o precio de lista del paquete entero si existe (ej: PRECIO, PRECIO TOTAL, PRECIO PAQUETE)

Responde estrictamente en formato JSON con la siguiente estructura:
{
  "codigo": number | 0,
  "nombre": number | 0,
  "marca": number | 0,
  "detalle": number | 0,
  "tamano": number | 0,
  "stock": number | 0,
  "unidad": number | 0,
  "costo": number | 0,
  "precioVenta": number | 0,
  "precioPaquete": number | 0
}
`;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const json = JSON.parse(textResponse);

      const resMap: { [key: string]: number } = {};
      Object.keys(json).forEach((k) => {
        if (typeof json[k] === 'number' && json[k] > 0) {
          resMap[k] = json[k];
        }
      });

      return Object.keys(resMap).length > 0 ? resMap : null;
    } catch (error) {
      console.warn('Advertencia Gemini AI Mapeo Columnas (usando detector local):', error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
