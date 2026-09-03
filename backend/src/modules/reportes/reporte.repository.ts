import { prisma } from '../../config/prisma';

export class ReporteRepository {
  async obtenerResumenFinanciero(fechaInicio: Date, fechaFin: Date) {
    const filtroVentas = {
      estado: 'COMPLETADA' as const,
      fecha: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const [agrupadoMetodos, agregacionCostos] = await Promise.all([
      prisma.venta.groupBy({
        by: ['metodoPago'],
        where: filtroVentas,
        _sum: { total: true },
      }),
      prisma.$queryRaw<Array<{ costoTotal: number | null }>>`
        SELECT 
          COALESCE(SUM(vd.cantidad * COALESCE(vd.costo_unitario, p.costo)), 0)::numeric as "costoTotal"
        FROM venta_detalle vd
        INNER JOIN ventas v ON v.id = vd.venta_id
        INNER JOIN productos p ON p.id = vd.producto_id
        WHERE v.estado::text = 'COMPLETADA'
          AND v.fecha >= ${fechaInicio}
          AND v.fecha <= ${fechaFin}
      `,
    ]);

    const metodosPagoConsolidado: Record<string, number> = {
      EFECTIVO: 0,
      TARJETA: 0,
      MIXTO: 0,
      FIADO: 0,
    };

    let ventasTotales = 0;
    for (const item of agrupadoMetodos) {
      const monto = Number(item._sum.total || 0);
      if (metodosPagoConsolidado[item.metodoPago] !== undefined) {
        metodosPagoConsolidado[item.metodoPago] = monto;
      }
      ventasTotales += monto;
    }

    const costoTotalVentas = Number(agregacionCostos[0]?.costoTotal || 0);
    const gananciaBruta = Number((ventasTotales - costoTotalVentas).toFixed(2));

    return {
      ventasTotales: Number(ventasTotales.toFixed(2)),
      costoTotalVentas: Number(costoTotalVentas.toFixed(2)),
      gananciaBruta,
      metodosPago: Object.entries(metodosPagoConsolidado).map(([metodo, total]) => ({
        metodo,
        total: Number(total.toFixed(2)),
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
        venta: {
          estado: 'COMPLETADA',
        },
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
        venta: {
          estado: 'COMPLETADA',
        },
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
