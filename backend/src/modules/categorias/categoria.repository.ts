import { prisma } from '../../config/prisma';
import { CrearCategoriaDto, ActualizarCategoriaDto } from './categoria.validator';

export class CategoriaRepository {
  async crear(data: CrearCategoriaDto) {
    return prisma.categoria.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });
  }

  async listar(filtros: { busqueda?: string; ordenarPor?: string; activo?: boolean } = {}) {
    const whereClause: any = {};
    if (filtros.activo !== undefined) {
      whereClause.activo = filtros.activo;
    }
    if (filtros.busqueda) {
      whereClause.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { descripcion: { contains: filtros.busqueda, mode: 'insensitive' } },
      ];
    }

    let orderByClause: any = { createdAt: 'desc' };
    switch (filtros.ordenarPor) {
      case 'antiguo':
        orderByClause = { createdAt: 'asc' };
        break;
      case 'nombre_asc':
        orderByClause = { nombre: 'asc' };
        break;
      case 'nombre_desc':
        orderByClause = { nombre: 'desc' };
        break;
      case 'reciente':
      default:
        orderByClause = { createdAt: 'desc' };
        break;
    }

    return prisma.categoria.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });
  }

  async obtenerPorId(id: string) {
    return prisma.categoria.findUnique({
      where: { id },
    });
  }

  async obtenerPorNombre(nombre: string) {
    // Búsqueda insensible a mayúsculas para evitar nombres duplicados
    return prisma.categoria.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive',
        },
        activo: true,
      },
    });
  }

  async actualizar(id: string, data: ActualizarCategoriaDto) {
    return prisma.categoria.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo,
      },
    });
  }

  async desactivar(id: string) {
    return prisma.categoria.update({
      where: { id },
      data: { activo: false },
    });
  }

  async contarProductosAsociados(id: string): Promise<number> {
    return prisma.producto.count({
      where: {
        categoriaId: id,
      },
    });
  }

  async eliminarFisico(id: string) {
    return prisma.categoria.delete({
      where: { id },
    });
  }
}

export const categoriaRepository = new CategoriaRepository();
