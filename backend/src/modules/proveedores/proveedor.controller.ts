import { Request, Response } from 'express';
import { proveedorService } from './proveedor.service';
import { crearProveedorSchema, actualizarProveedorSchema, filtrarProveedoresSchema } from './proveedor.validator';

export class ProveedorController {
  async crear(req: Request, res: Response): Promise<void> {
    const data = crearProveedorSchema.parse(req.body);
    const proveedor = await proveedorService.crear(data);
    res.status(201).json({ success: true, data: proveedor });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const filtros = filtrarProveedoresSchema.parse(req.query);
    const proveedores = await proveedorService.listar(filtros);
    res.json({ success: true, data: proveedores });
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const proveedor = await proveedorService.obtenerPorId(req.params.id);
    res.json({ success: true, data: proveedor });
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const data = actualizarProveedorSchema.parse(req.body);
    const proveedor = await proveedorService.actualizar(req.params.id, data);
    res.json({ success: true, data: proveedor });
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await proveedorService.eliminar(req.params.id);
    res.status(204).send();
  }
}

export const proveedorController = new ProveedorController();
