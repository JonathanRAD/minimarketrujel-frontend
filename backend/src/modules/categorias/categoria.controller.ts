import { Request, Response } from 'express';
import { categoriaService } from './categoria.service';
import { crearCategoriaSchema, actualizarCategoriaSchema } from './categoria.validator';

export class CategoriaController {
  async crear(req: Request, res: Response): Promise<void> {
    const data = crearCategoriaSchema.parse(req.body);
    const categoria = await categoriaService.crear(data);
    res.status(201).json({ success: true, data: categoria });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const activoParam = req.query.activo;
    const activo = activoParam === 'true' ? true : activoParam === 'false' ? false : undefined;
    const categorias = await categoriaService.listar(activo);
    res.json({ success: true, data: categorias });
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const categoria = await categoriaService.obtenerPorId(req.params.id);
    res.json({ success: true, data: categoria });
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const data = actualizarCategoriaSchema.parse(req.body);
    const categoria = await categoriaService.actualizar(req.params.id, data);
    res.json({ success: true, data: categoria });
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await categoriaService.eliminar(req.params.id);
    res.status(204).send();
  }
}

export const categoriaController = new CategoriaController();
