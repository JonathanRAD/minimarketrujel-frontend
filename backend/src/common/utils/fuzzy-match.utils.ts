/**
 * Utilidad de coincidencia difusa (Fuzzy Matching) para nombres de productos en Minimarket.
 * Identifica si dos nombres se refieren al mismo producto ignorando puntuación, conectores
 * y pequeñas variaciones ortográficas (ej: "ACEITE PRIMOR 900ML" vs "ACEITE -PRIMOR CLÁSICO 900 ML").
 */

export class FuzzyMatchUtils {
  /** Palabras irrelevantes / conectores / categorías a omitir */
  private static STOP_WORDS = new Set([
    'DE',
    'CON',
    'EL',
    'LA',
    'EN',
    'UN',
    'UNA',
    'DEL',
    'LOS',
    'LAS',
    'PARA',
    'POR',
    'SABOR',
    'CONTENIDO',
    'NETO',
    'GASEOSA',
    'BEBIDA',
    'BEBIDAS',
    'LACTEA',
    'LACTEAS',
    'SIN',
    'LACTOSA',
    'GLORIA',
    'PRODUCTO',
    'ARTICULO',
  ]);

  /** Normaliza texto: mayúsculas, sin acentos ni puntuación especial */
  public static normalizarTexto(str: string): string {
    return (str || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
      .replace(/[^A-Z0-9\s]/g, ' ') // Reemplazar caracteres especiales por espacios
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normaliza y extrae medidas/volúmenes/pesos (ej: "900 ML" -> "900ML", "3 LT" -> "3L", "80 GR" -> "80G")
   */
  public static extraerMedidas(str: string): string[] {
    const norm = this.normalizarTexto(str);

    // Unificar patrones de unidades comunes
    const estandarizado = norm
      .replace(/(\d+)\s*(ML|MILILITROS?)/gi, '$1ML')
      .replace(/(\d+)\s*(LITROS?|LT|L)/gi, '$1L')
      .replace(/(\d+)\s*(GRAMOS?|GR|G)/gi, '$1G')
      .replace(/(\d+)\s*(KILOGRAMOS?|KILOS?|KG)/gi, '$1KG');

    const matches = estandarizado.match(/\b\d+(ML|L|G|KG)\b/g);
    return matches ? Array.from(new Set(matches)) : [];
  }

  /** Extrae tokens (palabras clave) significativos omitiendo stop words */
  public static extraerTokens(str: string): string[] {
    const norm = this.normalizarTexto(str);
    const estandarizado = norm
      .replace(/(\d+)\s*(ML|MILILITROS?)/gi, '$1ML')
      .replace(/(\d+)\s*(LITROS?|LT|L)/gi, '$1L')
      .replace(/(\d+)\s*(GRAMOS?|GR|G)/gi, '$1G')
      .replace(/(\d+)\s*(KILOGRAMOS?|KILOS?|KG)/gi, '$1KG');

    const palabras = estandarizado.split(' ').filter(Boolean);

    return palabras.filter((p) => {
      if (p.length < 2 && !/\d/.test(p)) return false; // Omitir letras sueltas que no sean números
      return !this.STOP_WORDS.has(p);
    });
  }

  /**
   * Calcula la distancia de Levenshtein (edición) entre dos palabras.
   */
  public static distanciaLevenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // sustitución
            matrix[i][j - 1] + 1,     // inserción
            matrix[i - 1][j] + 1      // eliminación
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /** Similitud entre dos palabras individuales basada en Levenshtein (0.0 a 1.0) */
  public static similitudTokenLevenshtein(tokenA: string, tokenB: string): number {
    if (tokenA === tokenB) return 1.0;
    const maxLen = Math.max(tokenA.length, tokenB.length);
    if (maxLen === 0) return 1.0;
    const dist = this.distanciaLevenshtein(tokenA, tokenB);
    return Math.max(0, 1 - dist / maxLen);
  }

  /**
   * Similitud de bigramas de caracteres (mide cercanía ortográfica de la cadena completa)
   */
  public static similitudBigramas(str1: string, str2: string): number {
    const s1 = this.normalizarTexto(str1).replace(/\s+/g, '');
    const s2 = this.normalizarTexto(str2).replace(/\s+/g, '');

    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    const bigramas1: string[] = [];
    for (let i = 0; i < s1.length - 1; i++) {
      bigramas1.push(s1.substring(i, i + 2));
    }

    const bigramas2: string[] = [];
    for (let i = 0; i < s2.length - 1; i++) {
      bigramas2.push(s2.substring(i, i + 2));
    }

    const count2 = new Map<string, number>();
    for (const b of bigramas2) {
      count2.set(b, (count2.get(b) || 0) + 1);
    }

    let interseccion = 0;
    for (const b of bigramas1) {
      const c = count2.get(b) || 0;
      if (c > 0) {
        interseccion++;
        count2.set(b, c - 1);
      }
    }

    return (2 * interseccion) / (bigramas1.length + bigramas2.length);
  }

  /**
   * Calcula el puntaje de coincidencia global entre dos nombres de productos.
   * Reglas de oro:
   * 1. Si ambas cadenas tienen medidas y son DISTINTAS (ej: 900ML vs 500ML), el puntaje es 0 (son tamaños distintos).
   * 2. Tolerancia ortográfica en tokens (ej: CAPUCCHINO vs CAPUCCINO).
   * 3. Combina cobertura de tokens relevantes y similitud ortográfica por bigramas.
   */
  public static calcularPuntajeCoincidencia(nombreA: string, nombreB: string): number {
    const medidasA = this.extraerMedidas(nombreA);
    const medidasB = this.extraerMedidas(nombreB);

    // Si ambos especifican tamaño/medida y no tienen ninguna en común -> Productos de distinto tamaño
    if (medidasA.length > 0 && medidasB.length > 0) {
      const compartenMedida = medidasA.some((m) => medidasB.includes(m));
      if (!compartenMedida) {
        return 0; // Rechazo inmediato por diferencia de contenido/tamaño
      }
    }

    const tokensA = this.extraerTokens(nombreA);
    const tokensB = this.extraerTokens(nombreB);

    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    let coincidenciaTotalTokens = 0;
    const tokensBUsados = new Set<number>();

    for (const tA of tokensA) {
      let mejorSimilitudToken = 0;
      let mejorIdxB = -1;

      for (let j = 0; j < tokensB.length; j++) {
        if (tokensBUsados.has(j)) continue;
        const tB = tokensB[j];
        const sim = this.similitudTokenLevenshtein(tA, tB);
        if (sim > mejorSimilitudToken) {
          mejorSimilitudToken = sim;
          mejorIdxB = j;
        }
      }

      if (mejorSimilitudToken >= 0.75 && mejorIdxB !== -1) {
        coincidenciaTotalTokens += mejorSimilitudToken;
        tokensBUsados.add(mejorIdxB);
      }
    }

    // Coeficiente de Dice difuso sobre tokens
    const diceTokens = (2 * coincidenciaTotalTokens) / (tokensA.length + tokensB.length);

    // Ratio de cobertura respecto al nombre más corto en tokens
    const minTokens = Math.min(tokensA.length, tokensB.length);
    const ratioCoberturaCorta = minTokens > 0 ? coincidenciaTotalTokens / minTokens : 0;

    // Si todos los tokens clave principales coinciden (incluso con pequeñas variaciones ortográficas)
    const scoreTokens = Math.max(diceTokens, ratioCoberturaCorta);
    const scoreBigramas = this.similitudBigramas(nombreA, nombreB);

    // Ponderación final con máxima importancia a los tokens de producto y marca
    const finalScore = scoreTokens * 0.85 + scoreBigramas * 0.15;

    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Busca el mejor producto coincidente de una lista de candidatos en la BD.
   * @param nombreBuscar Nombre del producto proveniente del Excel
   * @param candidatos Lista de productos existentes en la BD
   * @param umbralMinimo Puntaje mínimo para considerar coincidencia (defecto: 0.72)
   */
  public static buscarMejorCoincidencia<T extends { id: string; nombre: string }>(
    nombreBuscar: string,
    candidatos: T[],
    umbralMinimo = 0.72
  ): { producto: T; puntaje: number } | null {
    let mejorProducto: T | null = null;
    let mejorPuntaje = 0;

    for (const candidato of candidatos) {
      const puntaje = this.calcularPuntajeCoincidencia(nombreBuscar, candidato.nombre);
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorProducto = candidato;
      }
    }

    if (mejorProducto && mejorPuntaje >= umbralMinimo) {
      return { producto: mejorProducto, puntaje: mejorPuntaje };
    }

    return null;
  }
}
