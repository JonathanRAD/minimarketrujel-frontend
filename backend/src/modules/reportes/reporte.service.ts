import { reporteRepository } from './reporte.repository';

export class ReporteService {
  async obtenerDashboard(fechaInicioStr?: string, fechaFinStr?: string) {
    let inicio: Date;
    let fin: Date;

    if (fechaInicioStr) {
      inicio = new Date(fechaInicioStr);
      inicio.setHours(0, 0, 0, 0);
    } else {
      // Por defecto, hace 30 días
      inicio = new Date();
      inicio.setDate(inicio.getDate() - 30);
      inicio.setHours(0, 0, 0, 0);
    }

    if (fechaFinStr) {
      fin = new Date(fechaFinStr);
      fin.setHours(23, 59, 59, 999);
    } else {
      // Por defecto, hoy a última hora
      fin = new Date();
      fin.setHours(23, 59, 59, 999);
    }

    const [resumenFinanciero, topProductos, estadoFiados] = await Promise.all([
      reporteRepository.obtenerResumenFinanciero(inicio, fin),
      reporteRepository.obtenerTopProductos(inicio, fin),
      reporteRepository.obtenerEstadoFiados(),
    ]);

    // Margen de ganancia porcentual
    const margenPorcentual = resumenFinanciero.ventasTotales > 0
      ? (resumenFinanciero.gananciaBruta / resumenFinanciero.ventasTotales) * 100
      : 0;

    return {
      rangoFechas: {
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      },
      resumenFinanciero: {
        ...resumenFinanciero,
        margenPorcentual,
      },
      topProductos,
      estadoFiados,
    };
  }
}

export const reporteService = new ReporteService();
