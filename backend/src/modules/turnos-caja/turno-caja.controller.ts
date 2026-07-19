import { Request, Response } from 'express';
import { turnoCajaService } from './turno-caja.service';
import { aperturaTurnoSchema, cierreTurnoSchema, filtrarTurnosSchema } from './turno-caja.validator';

export class TurnoCajaController {
  async obtenerActivo(req: Request, res: Response): Promise<void> {
    const usuarioId = req.usuario!.id;
    const turno = await turnoCajaService.obtenerActivo(usuarioId);
    res.json({ success: true, data: turno });
  }

  async abrirCaja(req: Request, res: Response): Promise<void> {
    const usuarioId = req.usuario!.id;
    const data = aperturaTurnoSchema.parse(req.body);
    const turno = await turnoCajaService.abrirCaja(data.montoInicial, usuarioId);
    res.status(201).json({ success: true, data: turno });
  }

  async cerrarCaja(req: Request, res: Response): Promise<void> {
    const usuarioId = req.usuario!.id;
    const data = cierreTurnoSchema.parse(req.body);
    const turno = await turnoCajaService.cerrarCaja(usuarioId, data);
    res.json({ success: true, data: turno });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const query = filtrarTurnosSchema.parse(req.query);
    const result = await turnoCajaService.listar(query);
    res.json({ success: true, data: result });
  }
}

export const turnoCajaController = new TurnoCajaController();
