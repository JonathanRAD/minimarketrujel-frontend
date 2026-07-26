import { prisma } from '../../config/prisma';
import { CrearPromocionDto, ActualizarPromocionDto, FiltrarPromocionesDto } from './promocion.validator';

export class PromocionRepository {
  async crear(data: CrearPromocionDto) {
    return prisma.promocion.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        tipo: data.tipo,
        productoId: data.productoId || null,
        categoriaId: data.categoriaId || null,
        valorDescuento: data.valorDescuento !== undefined && data.valorDescuento !== null ? data.valorDescuento : null,
        cantidadMinima: data.cantidadMinima ?? 1,
        cantidadGratis: data.cantidadGratis !== undefined && data.cantidadGratis !== null ? data.cantidadGratis : null,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        activo: data.activo !== undefined ? data.activo : true,
      },
      include: {
        producto: { select: { id: true, nombre: true, codigoBarras: true, precioVenta: true } },
        categoria: { select: { id: true, nombre: true } },
      },
    });
  }

  async listar(filtros: Partial<FiltrarPromocionesDto> = {}) {
    const whereClause: any = {};

    if (filtros.activo !== undefined) {
      whereClause.activo = filtros.activo;
    }

    if (filtros.busqueda) {
      whereClause.OR = [
        { titulo: { contains: filtros.busqueda, mode: 'insensitive' } },
        { producto: { nombre: { contains: filtros.busqueda, mode: 'insensitive' } } },
        { categoria: { nombre: { contains: filtros.busqueda, mode: 'insensitive' } } },
      ];
    }

    let orderByClause: any = { createdAt: 'desc' };
    switch (filtros.ordenarPor) {
      case 'antiguo':
        orderByClause = { createdAt: 'asc' };
        break;
      case 'vencimiento_asc':
        orderByClause = { fechaFin: 'asc' };
        break;
      case 'vencimiento_desc':
        orderByClause = { fechaFin: 'desc' };
        break;
      case 'titulo_asc':
        orderByClause = { titulo: 'asc' };
        break;
      case 'reciente':
      default:
        orderByClause = { createdAt: 'desc' };
        break;
    }

    const limite = filtros.limite ?? 10;
    const pagina = filtros.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    const [total, promociones] = await Promise.all([
      prisma.promocion.count({ where: whereClause }),
      prisma.promocion.findMany({
        where: whereClause,
        include: {
          producto: { select: { id: true, nombre: true, codigoBarras: true, precioVenta: true } },
          categoria: { select: { id: true, nombre: true } },
        },
        orderBy: orderByClause,
        skip,
        take: limite,
      }),
    ]);

    return {
      promociones,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    };
  }

  async obtenerPorId(id: string) {
    return prisma.promocion.findUnique({
      where: { id },
      include: {
        producto: { select: { id: true, nombre: true, codigoBarras: true, precioVenta: true } },
        categoria: { select: { id: true, nombre: true } },
      },
    });
  }

  /**
   * Obtiene todas las promociones activas cuya ventana temporal englobe la fecha actual
   */
  async obtenerPromocionesVigentes(fecha: Date = new Date()) {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    return prisma.promocion.findMany({
      where: {
        activo: true,
        fechaInicio: { lte: finDia },
        fechaFin: { gte: inicioDia },
      },
      include: {
        producto: { select: { id: true, nombre: true, codigoBarras: true, precioVenta: true, categoriaId: true } },
        categoria: { select: { id: true, nombre: true } },
      },
    });
  }

  async actualizar(id: string, data: ActualizarPromocionDto) {
    const payload: any = { ...data };
    if (data.fechaInicio) payload.fechaInicio = new Date(data.fechaInicio);
    if (data.fechaFin) payload.fechaFin = new Date(data.fechaFin);

    return prisma.promocion.update({
      where: { id },
      data: payload,
      include: {
        producto: { select: { id: true, nombre: true, codigoBarras: true, precioVenta: true } },
        categoria: { select: { id: true, nombre: true } },
      },
    });
  }

  async cambiarEstado(id: string, activo: boolean) {
    return prisma.promocion.update({
      where: { id },
      data: { activo },
    });
  }

  async eliminar(id: string) {
    return prisma.promocion.delete({
      where: { id },
    });
  }
}

export const promocionRepository = new PromocionRepository();
