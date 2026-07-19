import { Request, Response } from 'express';
import { productoService } from './producto.service';
import { crearProductoSchema, actualizarProductoSchema, filtrarProductosSchema } from './producto.validator';

/**
 * Capa de controlador: solo traduce HTTP <-> servicio.
 * No contiene lógica de negocio ni acceso a datos.
 */
export class ProductoController {
  async crear(req: Request, res: Response): Promise<void> {
    const data = crearProductoSchema.parse(req.body);
    const producto = await productoService.crear(data);
    res.status(201).json({ success: true, data: producto });
  }

  async listar(req: Request, res: Response): Promise<void> {
    const query = filtrarProductosSchema.parse(req.query);
    const result = await productoService.listar(query);
    res.json({ success: true, data: result });
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const producto = await productoService.obtenerPorId(req.params.id);
    res.json({ success: true, data: producto });
  }

  /** Endpoint clave para el POS: GET /api/productos/codigo-barras/:codigo */
  async buscarPorCodigoBarras(req: Request, res: Response): Promise<void> {
    const producto = await productoService.buscarPorCodigoBarras(req.params.codigo);
    res.json({ success: true, data: producto });
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const data = actualizarProductoSchema.parse(req.body);
    const producto = await productoService.actualizar(req.params.id, data);
    res.json({ success: true, data: producto });
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await productoService.eliminar(req.params.id);
    res.status(204).send();
  }

  async listarStockBajo(_req: Request, res: Response): Promise<void> {
    const productos = await productoService.listarStockBajo();
    res.json({ success: true, data: productos });
  }
}

export const productoController = new ProductoController();
