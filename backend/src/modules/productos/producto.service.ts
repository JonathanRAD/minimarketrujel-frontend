import { productoRepository } from './producto.repository';
import { CrearProductoDto, ActualizarProductoDto, FiltrarProductosDto } from './producto.validator';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';
import { prisma } from '../../config/prisma';

/**
 * Capa de lógica de negocio. No conoce Express ni Prisma directamente,
 * solo usa el repositorio. Esto la hace fácil de testear.
 */
export class ProductoService {
  async crear(data: CrearProductoDto) {
    const existente = await productoRepository.obtenerPorCodigoBarras(data.codigoBarras);
    if (existente) {
      throw new ConflictError('Ya existe un producto con ese código de barras');
    }
    return productoRepository.crear(data);
  }

  async listar(filtros: Partial<FiltrarProductosDto> = {}) {
    return productoRepository.listar({ activo: true, ...filtros });
  }

  async obtenerPorId(id: string) {
    const producto = await productoRepository.obtenerPorId(id);
    if (!producto) throw new NotFoundError('Producto');
    return producto;
  }

  /** Usado por la pantalla de venta: al escanear, se busca directo por código de barras */
  async buscarPorCodigoBarras(codigo: string) {
    const producto = await productoRepository.obtenerPorCodigoBarras(codigo);
    if (!producto) throw new NotFoundError('Producto con ese código de barras');
    return producto;
  }

  async actualizar(id: string, data: ActualizarProductoDto) {
    await this.obtenerPorId(id); // valida que exista
    if (data.codigoBarras) {
      const conflicto = await productoRepository.obtenerPorCodigoBarras(data.codigoBarras);
      if (conflicto && conflicto.id !== id) {
        throw new ConflictError('Ese código de barras ya está en uso por otro producto');
      }
    }
    return productoRepository.actualizar(id, data);
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);

    // Validar si tiene historial asociado
    const ventasAsociadas = await prisma.ventaDetalle.count({ where: { productoId: id } });
    const comprasAsociadas = await prisma.compraDetalle.count({ where: { productoId: id } });
    const movimientosAsociados = await prisma.movimientoInventario.count({ where: { productoId: id } });

    if (ventasAsociadas > 0 || comprasAsociadas > 0 || movimientosAsociados > 0) {
      throw new ConflictError(
        'No se puede eliminar físicamente el producto porque tiene historial de ventas, compras o movimientos en el inventario. Si no deseas venderlo más, puedes desactivarlo editándolo.'
      );
    }

    return productoRepository.eliminarFisico(id);
  }

  async listarStockBajo() {
    return productoRepository.listarStockBajo();
  }
}

export const productoService = new ProductoService();
