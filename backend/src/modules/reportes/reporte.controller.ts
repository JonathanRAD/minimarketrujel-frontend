import { Request, Response } from 'express';
import { reporteService } from './reporte.service';
import { consultaReporteSchema } from './reporte.validator';

export class ReporteController {
  async obtenerDashboard(req: Request, res: Response): Promise<void> {
    const filtros = consultaReporteSchema.parse(req.query);
    const data = await reporteService.obtenerDashboard(filtros.fechaInicio, filtros.fechaFin);
    res.json({ success: true, data });
  }
}

export const reporteController = new ReporteController();
