import { prisma } from '../../config/prisma';
import { CrearAjusteDto, FiltrarMovimientosDto } from './inventario.validator';
import { TipoMovimientoInventario } from '@prisma/client';

export class InventarioRepository {
  async listar(filtros: Partial<FiltrarMovimientosDto> = {}) {
    const whereClause: any = {};

    if (filtros.productoId) {
      whereClause.productoId = filtros.productoId;
    }

    if (filtros.tipo) {
      whereClause.tipo = filtros.tipo as TipoMovimientoInventario;
    }

    if (filtros.fechaInicio || filtros.fechaFin) {
      whereClause.fecha = {};
      if (filtros.fechaInicio) {
        whereClause.fecha.gte = new Date(filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        whereClause.fecha.lte = new Date(filtros.fechaFin);
      }
    }

    const limite = filtros.limite ?? 10;
    const pagina = filtros.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    const [total, movimientos] = await Promise.all([
      prisma.movimientoInventario.count({ where: whereClause }),
      prisma.movimientoInventario.findMany({
        where: whereClause,
        include: {
          producto: {
            select: {
              nombre: true,
              codigoBarras: true,
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
      movimientos,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    };
  }

  async crearAjuste(data: CrearAjusteDto, usuarioId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Modificar stock del producto
      const producto = await tx.producto.update({
        where: { id: data.productoId },
        data: {
          stockActual: {
            increment: data.cantidad, // incrementa (o decrementa si es negativo)
          },
        },
      });

      // 2. Crear movimiento de inventario
      const movimiento = await tx.movimientoInventario.create({
        data: {
          productoId: data.productoId,
          tipo: data.tipo as TipoMovimientoInventario,
          cantidad: data.cantidad,
          motivo: data.motivo,
          usuarioId,
        },
        include: {
          producto: {
            select: {
              nombre: true,
              codigoBarras: true,
            },
          },
        },
      });

      return { producto, movimiento };
    });
  }
}

export const inventarioRepository = new InventarioRepository();
