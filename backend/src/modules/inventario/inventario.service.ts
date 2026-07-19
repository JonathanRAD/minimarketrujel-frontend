import { inventarioRepository } from './inventario.repository';
import { CrearAjusteDto, FiltrarMovimientosDto } from './inventario.validator';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError';

export class InventarioService {
  async listar(filtros: Partial<FiltrarMovimientosDto> = {}) {
    return inventarioRepository.listar(filtros);
  }

  async crearAjuste(data: CrearAjusteDto, usuarioId: string) {
    // 1. Validar que el producto exista y esté activo
    const producto = await prisma.producto.findUnique({
      where: { id: data.productoId },
    });
    if (!producto || !producto.activo) {
      throw new NotFoundError('El producto seleccionado no existe o está inactivo');
    }

    // 2. Validar que el ajuste no dejer el stock negativo
    const nuevoStock = Number(producto.stockActual) + data.cantidad;
    if (nuevoStock < 0) {
      throw new BadRequestError(
        `El ajuste dejaría el stock en negativo (${nuevoStock}). El stock mínimo posible es 0.`
      );
    }

    // 3. Ejecutar transacción
    return inventarioRepository.crearAjuste(data, usuarioId);
  }
}

export const inventarioService = new InventarioService();
