import { prisma } from '../../config/prisma';
import { CrearCompraDto, FiltrarComprasDto } from './compra.validator';
import { EstadoCompra, TipoMovimientoInventario } from '@prisma/client';

export class CompraRepository {
  async listar(filtros: Partial<FiltrarComprasDto> = {}) {
    const whereClause: any = {};

    if (filtros.proveedorId) {
      whereClause.proveedorId = filtros.proveedorId;
    }

    if (filtros.desde || filtros.hasta) {
      whereClause.fecha = {};
      if (filtros.desde) whereClause.fecha.gte = new Date(filtros.desde);
      if (filtros.hasta) whereClause.fecha.lte = new Date(filtros.hasta);
    }

    const limite = filtros.limite ?? 10;
    const pagina = filtros.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    const [total, compras] = await Promise.all([
      prisma.compra.count({ where: whereClause }),
      prisma.compra.findMany({
        where: whereClause,
        include: {
          proveedor: {
            select: {
              nombre: true,
            },
          },
          usuario: {
            select: {
              nombre: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
        skip,
        take: limite,
      })
    ]);

    return {
      compras,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    };
  }

  async obtenerPorId(id: string) {
    return prisma.compra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        usuario: {
          select: {
            nombre: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: {
              select: {
                nombre: true,
                codigoBarras: true,
              },
            },
          },
        },
      },
    });
  }

  async crearCompraSinRecibir(data: CrearCompraDto, total: number, usuarioId: string) {
    return prisma.compra.create({
      data: {
        proveedorId: data.proveedorId,
        usuarioId,
        total,
        estado: EstadoCompra.PENDIENTE,
        detalles: {
          create: data.detalles.map((d) => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            costoUnitario: d.costoUnitario,
            subtotal: d.cantidad * d.costoUnitario,
          })),
        },
      },
      include: {
        detalles: true,
      },
    });
  }

  async crearCompraRecibida(data: CrearCompraDto, total: number, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Crear la compra y detalles
      const compra = await tx.compra.create({
        data: {
          proveedorId: data.proveedorId,
          usuarioId,
          total,
          estado: EstadoCompra.RECIBIDA,
          detalles: {
            create: data.detalles.map((d) => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              costoUnitario: d.costoUnitario,
              subtotal: d.cantidad * d.costoUnitario,
            })),
          },
        },
        include: {
          detalles: true,
        },
      });

      // 2. Aumentar stock de productos y registrar movimientos de inventario
      for (const det of compra.detalles) {
        // Aumentar stock
        await tx.producto.update({
          where: { id: det.productoId },
          data: {
            stockActual: {
              increment: det.cantidad,
            },
            costo: det.costoUnitario, // actualiza el costo al costo de la última compra
          },
        });

        // Registrar auditoría de inventario
        await tx.movimientoInventario.create({
          data: {
            productoId: det.productoId,
            tipo: TipoMovimientoInventario.COMPRA,
            cantidad: det.cantidad,
            motivo: `Compra registrada (Folio: ${compra.id})`,
            usuarioId,
            referenciaId: compra.id,
          },
        });
      }

      return compra;
    });
  }

  async cambiarEstadoARecibida(id: string, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Obtener los detalles de la compra
      const compra = await tx.compra.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!compra) {
        throw new Error('Compra no encontrada');
      }

      // 2. Actualizar estado
      const compraActualizada = await tx.compra.update({
        where: { id },
        data: { estado: EstadoCompra.RECIBIDA },
      });

      // 3. Aumentar stock de productos y registrar auditorías
      for (const det of compra.detalles) {
        await tx.producto.update({
          where: { id: det.productoId },
          data: {
            stockActual: {
              increment: det.cantidad,
            },
            costo: det.costoUnitario,
          },
        });

        await tx.movimientoInventario.create({
          data: {
            productoId: det.productoId,
            tipo: TipoMovimientoInventario.COMPRA,
            cantidad: det.cantidad,
            motivo: `Recepción de compra pendiente (Folio: ${compra.id})`,
            usuarioId,
            referenciaId: compra.id,
          },
        });
      }

      return compraActualizada;
    });
  }

  async cambiarEstadoACancelada(id: string, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Obtener la compra y detalles
      const compra = await tx.compra.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!compra) {
        throw new Error('Compra no encontrada');
      }

      // 2. Actualizar estado a CANCELADA
      const compraActualizada = await tx.compra.update({
        where: { id },
        data: { estado: EstadoCompra.CANCELADA },
      });

      // 3. Si la compra ya estaba RECIBIDA, se debe hacer la reversión de stock
      if (compra.estado === EstadoCompra.RECIBIDA) {
        for (const det of compra.detalles) {
          // Restar stock
          await tx.producto.update({
            where: { id: det.productoId },
            data: {
              stockActual: {
                decrement: det.cantidad,
              },
            },
          });

          // Registrar movimiento de inventario negativo
          await tx.movimientoInventario.create({
            data: {
              productoId: det.productoId,
              tipo: TipoInventarioAdaptado(TipoMovimientoInventario.AJUSTE),
              cantidad: -Number(det.cantidad), // negativo
              motivo: `Anulación de compra (Folio: ${compra.id})`,
              usuarioId,
              referenciaId: compra.id,
            },
          });
        }
      }

      return compraActualizada;
    });
  }
}

// Auxiliar para evitar problemas de tipos de compilación con prisma Decimal
function TipoInventarioAdaptado(val: TipoMovimientoInventario): TipoMovimientoInventario {
  return val;
}

export const compraRepository = new CompraRepository();
