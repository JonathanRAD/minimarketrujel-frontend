import { Request, Response } from 'express';
import { reporteService } from './reporte.service';
import { consultaReporteSchema } from './reporte.validator';

export class ReporteController {
  async obtenerDashboard(req: Request, res: Response): Promise<void> {
    const filtros = consultaReporteSchema.parse(req.query);
    const data = await reporteService.obtenerDashboard(filtros.fechaInicio, filtros.fechaFin);
    res.json({ success: true, data });
  }

  async exportarExcel(req: Request, res: Response): Promise<void> {
    const { tabla } = req.params;

    switch (tabla.toLowerCase()) {
      case 'productos':
        await reporteService.exportarProductosExcel(res);
        break;
      case 'categorias':
        await reporteService.exportarCategoriasExcel(res);
        break;
      case 'clientes':
        await reporteService.exportarClientesExcel(res);
        break;
      case 'proveedores':
        await reporteService.exportarProveedoresExcel(res);
        break;
      case 'ventas':
        await reporteService.exportarVentasExcel(res);
        break;
      case 'compras':
        await reporteService.exportarComprasExcel(res);
        break;
      case 'inventario':
        await reporteService.exportarInventarioExcel(res);
        break;
      case 'turnos-caja':
      case 'turnoscaja':
        await reporteService.exportarTurnosCajaExcel(res);
        break;
      default:
        res.status(400).json({
          success: false,
          message: `Tabla '${tabla}' no reconocida para exportación de Excel`,
        });
    }
  }
}

export const reporteController = new ReporteController();
