import { prisma } from '../../config/prisma';

export class ReporteRepository {
  async obtenerResumenFinanciero(fechaInicio: Date, fechaFin: Date) {
    const ventas = await prisma.venta.findMany({
      where: {
        estado: 'COMPLETADA',
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                nombre: true,
                costo: true,
              },
            },
          },
        },
      },
    });

    let ventasTotales = 0;
    let costoTotalVentas = 0;
    const metodosPagoConsolidado: Record<string, number> = {
      EFECTIVO: 0,
      TARJETA: 0,
      MIXTO: 0,
      FIADO: 0,
    };

    for (const venta of ventas) {
      const totalVenta = Number(venta.total);
      ventasTotales += totalVenta;

      // Sumar al método de pago correspondiente
      if (metodosPagoConsolidado[venta.metodoPago] !== undefined) {
        metodosPagoConsolidado[venta.metodoPago] += totalVenta;
      }

      // Calcular costo de los productos vendidos
      for (const detalle of venta.detalles) {
        const cantidad = Number(detalle.cantidad);
        const costoUnitario = Number(detalle.producto.costo);
        costoTotalVentas += cantidad * costoUnitario;
      }
    }

    const gananciaBruta = ventasTotales - costoTotalVentas;

    return {
      ventasTotales,
      costoTotalVentas,
      gananciaBruta,
      metodosPago: Object.entries(metodosPagoConsolidado).map(([metodo, total]) => ({
        metodo,
        total,
      })),
    };
  }

  async obtenerTopProductos(fechaInicio: Date, fechaFin: Date) {
    const agrupado = await prisma.ventaDetalle.groupBy({
      by: ['productoId'],
      where: {
        venta: {
          estado: 'COMPLETADA',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      },
      _sum: {
        cantidad: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          cantidad: 'desc',
        },
      },
      take: 5,
    });

    const resultados = [];
    for (const item of agrupado) {
      const producto = await prisma.producto.findUnique({
        where: { id: item.productoId },
        select: { nombre: true, codigoBarras: true },
      });

      resultados.push({
        productoId: item.productoId,
        nombre: producto?.nombre || 'Producto Desconocido',
        codigoBarras: producto?.codigoBarras || '',
        cantidadVendida: Number(item._sum.cantidad || 0),
        totalFacturado: Number(item._sum.subtotal || 0),
      });
    }

    return resultados;
  }

  async obtenerEstadoFiados() {
    const fiadosNoPagados = await prisma.fiado.aggregate({
      where: {
        pagado: false,
      },
      _sum: {
        monto: true,
      },
      _count: true,
    });

    // Contar cuántos clientes únicos tienen fiados pendientes
    const clientesConDeuda = await prisma.fiado.groupBy({
      by: ['clienteId'],
      where: {
        pagado: false,
      },
    });

    return {
      totalDeudaPendiente: Number(fiadosNoPagados._sum.monto || 0),
      fiadosPendientesConteo: fiadosNoPagados._count,
      clientesConDeudaConteo: clientesConDeuda.length,
    };
  }
}

export const reporteRepository = new ReporteRepository();
