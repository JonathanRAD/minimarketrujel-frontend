import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';
import { ValidationError, NotFoundError } from '../../common/errors/AppError';
import { FiltrarVentasDto } from './venta.validator';

export class VentaRepository {
  async listar(filtros: Partial<FiltrarVentasDto> = {}) {
    const whereClause: any = {
      estado: 'COMPLETADA',
    };

    if (filtros.usuarioId) {
      whereClause.usuarioId = filtros.usuarioId;
    }

    if (filtros.desde || filtros.hasta) {
      whereClause.fecha = {};
      if (filtros.desde) whereClause.fecha.gte = new Date(filtros.desde);
      if (filtros.hasta) whereClause.fecha.lte = new Date(filtros.hasta);
    }

    const limite = filtros.limite ?? 10;
    const pagina = filtros.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    const [total, ventas] = await Promise.all([
      prisma.venta.count({ where: whereClause }),
      prisma.venta.findMany({
        where: whereClause,
        include: { detalles: { include: { producto: true } }, usuario: true },
        orderBy: { fecha: 'desc' },
        skip,
        take: limite,
      })
    ]);

    return {
      ventas,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    };
  }

  async obtenerPorId(id: string) {
    return prisma.venta.findUnique({
      where: { id },
      include: { detalles: { include: { producto: true } }, usuario: true, cliente: true },
    });
  }

  /**
   * Crea la venta completa dentro de UNA transacción atómica:
   * 1) crea la venta y sus detalles
   * 2) descuenta el stock de cada producto
   * 3) registra el movimiento de inventario correspondiente
   * Si algo falla en el camino, TODO se revierte (no queda stock inconsistente).
   */
  async crearConTransaccion(params: {
    id?: string;
    usuarioId: string;
    clienteId?: string;
    turnoId?: string;
    metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO' | 'FIADO';
    montoEfectivo: number;
    montoTarjeta: number;
    detalles: { productoId: string; cantidad: number; precioUnitario: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Validar existencias y stock dentro de la transacción atómica
      for (const detalle of params.detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: detalle.productoId }
        });
        if (!producto) {
          throw new NotFoundError(`Producto con ID ${detalle.productoId} no encontrado`);
        }
        if (Number(producto.stockActual) < detalle.cantidad) {
          throw new ValidationError(
            `Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stockActual}, solicitado: ${detalle.cantidad})`
          );
        }
      }

      const total = params.detalles.reduce(
        (acc, d) => acc + d.cantidad * d.precioUnitario,
        0,
      );

      const venta = await tx.venta.create({
        data: {
          id: params.id,
          usuarioId: params.usuarioId,
          clienteId: params.clienteId,
          turnoId: params.turnoId,
          metodoPago: params.metodoPago,
          montoEfectivo: new Prisma.Decimal(params.montoEfectivo),
          montoTarjeta: new Prisma.Decimal(params.montoTarjeta),
          total: new Prisma.Decimal(total),
          detalles: {
            create: params.detalles.map((d) => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.cantidad * d.precioUnitario,
            })),
          },
        },
        include: { detalles: true },
      });

      for (const detalle of params.detalles) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stockActual: { decrement: detalle.cantidad } },
        });

        await tx.movimientoInventario.create({
          data: {
            productoId: detalle.productoId,
            tipo: 'VENTA',
            cantidad: -detalle.cantidad,
            usuarioId: params.usuarioId,
            referenciaId: venta.id,
            motivo: `Venta ${venta.id}`,
          },
        });
      }

      return venta;
    });
  }

  async anular(id: string, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      const venta = await tx.venta.update({
        where: { id },
        data: { estado: 'ANULADA' },
        include: { detalles: true },
      });

      // Devuelve el stock de cada producto de la venta anulada
      for (const detalle of venta.detalles) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stockActual: { increment: detalle.cantidad } },
        });

        await tx.movimientoInventario.create({
          data: {
            productoId: detalle.productoId,
            tipo: 'DEVOLUCION',
            cantidad: Number(detalle.cantidad),
            usuarioId,
            referenciaId: venta.id,
            motivo: `Anulación de venta ${venta.id}`,
          },
        });
      }

      return venta;
    });
  }
}

export const ventaRepository = new VentaRepository();
