import { Request, Response } from 'express';
import { inventarioService } from './inventario.service';
import { crearAjusteSchema, filtrarMovimientosSchema } from './inventario.validator';

export class InventarioController {
  async listar(req: Request, res: Response): Promise<void> {
    const filtros = filtrarMovimientosSchema.parse(req.query);
    const movimientos = await inventarioService.listar(filtros);
    res.json({ success: true, data: movimientos });
  }

  async crearAjuste(req: Request, res: Response): Promise<void> {
    const usuarioId = req.usuario!.id;
    const data = crearAjusteSchema.parse(req.body);
    const resultado = await inventarioService.crearAjuste(data, usuarioId);
    res.status(201).json({ success: true, data: resultado.movimiento });
  }
}

export const inventarioController = new InventarioController();
