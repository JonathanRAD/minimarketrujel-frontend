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

  async listar(filtros: { activo?: boolean } = {}) {
    return prisma.categoria.findMany({
      where: filtros.activo !== undefined ? { activo: filtros.activo } : undefined,
      orderBy: {
        nombre: 'asc',
      },
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
        activo: true, // solo contamos los productos activos asociados
      },
    });
  }
}

export const categoriaRepository = new CategoriaRepository();
