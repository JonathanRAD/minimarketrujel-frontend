import { prisma } from '../../config/prisma';
import { CrearProductoDto, ActualizarProductoDto, FiltrarProductosDto } from './producto.validator';

/**
 * Capa de acceso a datos. Solo esta capa conoce Prisma directamente.
 * Si mañana cambias de ORM, solo tocas este archivo.
 */
export class ProductoRepository {
  async crear(data: CrearProductoDto) {
    return prisma.producto.create({ data });
  }

  async listar(filtros: Partial<FiltrarProductosDto> & { activo?: boolean } = {}) {
    const whereClause: any = {
      activo: filtros.activo !== undefined ? filtros.activo : { not: false },
    };

    if (filtros.categoriaId) {
      whereClause.categoriaId = filtros.categoriaId;
    }

    if (filtros.busqueda) {
      whereClause.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { codigoBarras: { contains: filtros.busqueda } },
      ];
    }

    if (filtros.todo === true) {
      const productos = await prisma.producto.findMany({
        where: whereClause,
        include: { categoria: true },
        orderBy: { nombre: 'asc' },
      });
      return {
        productos,
        total: productos.length,
        pagina: 1,
        limite: productos.length,
        paginas: 1,
      };
    }

    const limite = filtros.limite ?? 10;
    const pagina = filtros.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    const [total, productos] = await Promise.all([
      prisma.producto.count({ where: whereClause }),
      prisma.producto.findMany({
        where: whereClause,
        include: { categoria: true },
        orderBy: { nombre: 'asc' },
        skip,
        take: limite,
      })
    ]);

    return {
      productos,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    };
  }

  async obtenerPorId(id: string) {
    return prisma.producto.findUnique({
      where: { id },
      include: { categoria: true },
    });
  }

  async obtenerPorCodigoBarras(codigoBarras: string) {
    return prisma.producto.findUnique({ where: { codigoBarras } });
  }

  async actualizar(id: string, data: ActualizarProductoDto) {
    return prisma.producto.update({ where: { id }, data });
  }

  async desactivar(id: string) {
    return prisma.producto.update({ where: { id }, data: { activo: false } });
  }

  async eliminarFisico(id: string) {
    return prisma.producto.delete({ where: { id } });
  }

  async listarStockBajo() {
    // Productos donde el stock actual ya llegó o pasó el mínimo configurado
    return prisma.$queryRaw`
      SELECT * FROM productos
      WHERE activo = true AND stock_actual <= stock_minimo
      ORDER BY stock_actual ASC
    `;
  }

  /** Ajusta el stock sumando (positivo) o restando (negativo) una cantidad, dentro de una transacción */
  async ajustarStock(id: string, cantidadDelta: number, tx = prisma) {
    return tx.producto.update({
      where: { id },
      data: { stockActual: { increment: cantidadDelta } },
    });
  }
}

export const productoRepository = new ProductoRepository();
