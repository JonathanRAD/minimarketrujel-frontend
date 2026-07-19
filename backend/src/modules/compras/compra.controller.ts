import { Request, Response } from 'express';
import { compraService } from './compra.service';
import { crearCompraSchema, actualizarEstadoCompraSchema, filtrarComprasSchema } from './compra.validator';
import { EstadoCompra } from '@prisma/client';

export class CompraController {
  async crear(req: Request, res: Response): Promise<void> {
    const usuarioId = req.usuario!.id;
    const data = crearCompraSchema.parse(req.body);
    const compra = await compraService.crear(data, usuarioId);
    res.status(201).json({ success: true, data: compra });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const query = filtrarComprasSchema.parse(req.query);
    const result = await compraService.listar(query);
    res.json({ success: true, data: result });
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const compra = await compraService.obtenerPorId(req.params.id);
    res.json({ success: true, data: compra });
  }

  async actualizarEstado(req: Request, res: Response): Promise<void> {
    const usuarioId = req.usuario!.id;
    const data = actualizarEstadoCompraSchema.parse(req.body);
    const compra = await compraService.actualizarEstado(req.params.id, data.estado as EstadoCompra, usuarioId);
    res.json({ success: true, data: compra });
  }
}

export const compraController = new CompraController();
