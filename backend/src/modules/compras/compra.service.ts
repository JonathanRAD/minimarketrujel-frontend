import { compraRepository } from './compra.repository';
import { CrearCompraDto, ActualizarEstadoCompraDto, FiltrarComprasDto } from './compra.validator';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError';
import { EstadoCompra } from '@prisma/client';

export class CompraService {
  async crear(data: CrearCompraDto, usuarioId: string) {
    // 1. Validar que el proveedor exista y esté activo
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: data.proveedorId },
    });
    if (!proveedor || !proveedor.activo) {
      throw new NotFoundError('El proveedor seleccionado no existe o está inactivo');
    }

    // 2. Validar que todos los productos existan y estén activos
    const productoIds = data.detalles.map((d) => d.productoId);
    const productos = await prisma.producto.findMany({
      where: {
        id: { in: productoIds },
        activo: true,
      },
    });

    if (productos.length !== Array.from(new Set(productoIds)).length) {
      throw new BadRequestError('Uno o más productos seleccionados no son válidos o están inactivos');
    }

    // 3. Calcular el total
    const total = data.detalles.reduce((acc, d) => acc + d.cantidad * d.costoUnitario, 0);

    // 4. Llamar al repositorio según el estado deseado
    if (data.estado === 'RECIBIDA') {
      return compraRepository.crearCompraRecibida(data, total, usuarioId);
    } else {
      return compraRepository.crearCompraSinRecibir(data, total, usuarioId);
    }
  }

  async listar(filtros: Partial<FiltrarComprasDto> = {}) {
    return compraRepository.listar(filtros);
  }

  async obtenerPorId(id: string) {
    const compra = await compraRepository.obtenerPorId(id);
    if (!compra) {
      throw new NotFoundError('Compra no encontrada');
    }
    return compra;
  }

  async actualizarEstado(id: string, nuevoEstado: EstadoCompra, usuarioId: string) {
    const compra = await this.obtenerPorId(id);

    // Si ya está cancelada, no permitir cambios de estado
    if (compra.estado === EstadoCompra.CANCELADA) {
      throw new BadRequestError('No se pueden modificar compras canceladas');
    }

    // Transición de PENDIENTE a RECIBIDA
    if (compra.estado === EstadoCompra.PENDIENTE && nuevoEstado === EstadoCompra.RECIBIDA) {
      return compraRepository.cambiarEstadoARecibida(id, usuarioId);
    }

    // Transición de RECIBIDA a CANCELADA
    if (compra.estado === EstadoCompra.RECIBIDA && nuevoEstado === EstadoCompra.CANCELADA) {
      return compraRepository.cambiarEstadoACancelada(id, usuarioId);
    }

    // Transición directa de PENDIENTE a CANCELADA (sin pasar por RECIBIDA)
    if (compra.estado === EstadoCompra.PENDIENTE && nuevoEstado === EstadoCompra.CANCELADA) {
      return compraRepository.cambiarEstadoACancelada(id, usuarioId);
    }

    throw new BadRequestError(`Transición de estado no válida de ${compra.estado} a ${nuevoEstado}`);
  }
}

export const compraService = new CompraService();
