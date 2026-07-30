const TIMEZONE_OFFSET_HOURS = -5; // America/Lima (Peru UTC-5)

/**
 * Convierte un string de fecha (YYYY-MM-DD o ISO) en la fecha de inicio del día (00:00:00.000)
 * en la zona horaria del negocio (UTC-5).
 */
export function parseFechaInicio(fechaStr?: string): Date {
  if (!fechaStr) {
    const ahora = new Date();
    ahora.setDate(ahora.getDate() - 30);
    return parseFechaInicio(ahora.toISOString().split('T')[0]);
  }

  const datePart = fechaStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  if (year && month && day) {
    // 00:00:00 en UTC-5 equivale a (00 - (-5)) = 05:00:00 UTC
    return new Date(Date.UTC(year, month - 1, day, 0 - TIMEZONE_OFFSET_HOURS, 0, 0, 0));
  }

  const fallback = new Date(fechaStr);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Convierte un string de fecha (YYYY-MM-DD o ISO) en la fecha de fin del día (23:59:59.999)
 * en la zona horaria del negocio (UTC-5).
 */
export function parseFechaFin(fechaStr?: string): Date {
  if (!fechaStr) {
    const ahora = new Date();
    return parseFechaFin(ahora.toISOString().split('T')[0]);
  }

  const datePart = fechaStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  if (year && month && day) {
    // 23:59:59.999 en UTC-5 equivale a (23 - (-5)) = el día siguiente a las 04:59:59.999 UTC
    return new Date(Date.UTC(year, month - 1, day, 23 - TIMEZONE_OFFSET_HOURS, 59, 59, 999));
  }

  const fallback = new Date(fechaStr);
  fallback.setHours(23, 59, 59, 999);
  return fallback;
}
