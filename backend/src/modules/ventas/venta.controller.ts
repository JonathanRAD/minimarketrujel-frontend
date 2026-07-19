import { Request, Response } from 'express';
import { ventaService } from './venta.service';
import { crearVentaSchema, filtrarVentasSchema } from './venta.validator';

export class VentaController {
  async crear(req: Request, res: Response): Promise<void> {
    const data = crearVentaSchema.parse(req.body);
    const venta = await ventaService.crear(req.usuario!.id, data);
    res.status(201).json({ success: true, data: venta });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const filtros = filtrarVentasSchema.parse(req.query);
    const result = await ventaService.listar(filtros);
    res.json({ success: true, data: result });
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const venta = await ventaService.obtenerPorId(req.params.id);
    res.json({ success: true, data: venta });
  }

  async anular(req: Request, res: Response): Promise<void> {
    const venta = await ventaService.anular(req.params.id, req.usuario!.id);
    res.json({ success: true, data: venta });
  }
}

export const ventaController = new VentaController();
