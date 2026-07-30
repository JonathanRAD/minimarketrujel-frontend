/**
 * Genera variaciones de términos para búsquedas insensibles a tildes/acentos en Prisma.
 */
export function getSearchTermVariations(term: string): string[] {
  const norm = term.trim().toLowerCase();
  if (!norm) return [];

  const unaccented = norm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const set = new Set<string>();
  set.add(term);
  set.add(norm);
  set.add(unaccented);

  // Variaciones comunes para vocales con tilde en español
  let withAccents = unaccented
    .replace(/a/g, 'á')
    .replace(/e/g, 'é')
    .replace(/i/g, 'í')
    .replace(/o/g, 'ó')
    .replace(/u/g, 'ú');
  set.add(withAccents);

  // Si tiene vocales individuales comunes
  if (unaccented.includes('a')) set.add(unaccented.replace('a', 'á'));
  if (unaccented.includes('e')) set.add(unaccented.replace('e', 'é'));
  if (unaccented.includes('i')) set.add(unaccented.replace('i', 'í'));
  if (unaccented.includes('o')) set.add(unaccented.replace('o', 'ó'));
  if (unaccented.includes('u')) set.add(unaccented.replace('u', 'ú'));

  return Array.from(set).filter(Boolean);
}

/**
 * Convierte un query de búsqueda multi-palabra en condiciones `AND` para Prisma.
 * Cada palabra ingresada debe coincidir con al menos uno de los campos pasados (en `OR`).
 */
export function buildMultiTermWhere(busqueda: string, fieldNames: string[] = ['nombre', 'codigoBarras']) {
  if (!busqueda || busqueda.trim() === '') return undefined;

  const terms = busqueda.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return undefined;

  return terms.map((t) => {
    const variations = getSearchTermVariations(t);
    return {
      OR: fieldNames.flatMap((field) =>
        variations.map((varItem) => ({
          [field]: { contains: varItem, mode: 'insensitive' as const },
        }))
      ),
    };
  });
}
