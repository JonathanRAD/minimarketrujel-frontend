import { Request, Response } from 'express';
import { clienteService } from './cliente.service';
import { crearClienteSchema, actualizarClienteSchema, filtrarClientesSchema } from './cliente.validator';

export class ClienteController {
  async crear(req: Request, res: Response): Promise<void> {
    const data = crearClienteSchema.parse(req.body);
    const cliente = await clienteService.crear(data);
    res.status(201).json({ success: true, data: cliente });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const query = filtrarClientesSchema.parse(req.query);
    const result = await clienteService.listar(query);
    res.json({ success: true, data: result });
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const cliente = await clienteService.obtenerPorId(req.params.id);
    res.json({ success: true, data: cliente });
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const data = actualizarClienteSchema.parse(req.body);
    const cliente = await clienteService.actualizar(req.params.id, data);
    res.json({ success: true, data: cliente });
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await clienteService.eliminar(req.params.id);
    res.status(204).send();
  }

  // --- FIADOS ---

  async listarFiadosPendientes(req: Request, res: Response): Promise<void> {
    const fiados = await clienteService.listarFiadosPendientes(req.params.id);
    res.json({ success: true, data: fiados });
  }

  async pagarFiado(req: Request, res: Response): Promise<void> {
    const fiado = await clienteService.pagarFiado(req.params.fiadoId);
    res.json({ success: true, data: fiado });
  }
}

export const clienteController = new ClienteController();
