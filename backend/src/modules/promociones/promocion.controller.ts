import { Request, Response } from 'express';
import { promocionService } from './promocion.service';
import { crearPromocionSchema, actualizarPromocionSchema, filtrarPromocionesSchema } from './promocion.validator';

export class PromocionController {
  async crear(req: Request, res: Response): Promise<void> {
    const data = crearPromocionSchema.parse(req.body);
    const promocion = await promocionService.crear(data);
    res.status(201).json({ success: true, data: promocion });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const filtros = filtrarPromocionesSchema.parse(req.query);
    const result = await promocionService.listar(filtros);
    res.json({ success: true, data: result });
  }

  async obtenerVigentes(_req: Request, res: Response): Promise<void> {
    const vigentes = await promocionService.obtenerVigentes();
    res.json({ success: true, data: vigentes });
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const promocion = await promocionService.obtenerPorId(req.params.id);
    res.json({ success: true, data: promocion });
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const data = actualizarPromocionSchema.parse(req.body);
    const promocion = await promocionService.actualizar(req.params.id, data);
    res.json({ success: true, data: promocion });
  }

  async cambiarEstado(req: Request, res: Response): Promise<void> {
    const { activo } = req.body;
    const promocion = await promocionService.cambiarEstado(req.params.id, Boolean(activo));
    res.json({ success: true, data: promocion });
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await promocionService.eliminar(req.params.id);
    res.status(204).send();
  }
}

export const promocionController = new PromocionController();
