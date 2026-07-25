import { prisma } from '../../config/prisma';
import { CrearProveedorDto, ActualizarProveedorDto } from './proveedor.validator';

export class ProveedorRepository {
  async crear(data: CrearProveedorDto) {
    return prisma.proveedor.create({
      data: {
        nombre: data.nombre,
        contacto: data.contacto || null,
        telefono: data.telefono || null,
        email: data.email || null,
        direccion: data.direccion || null,
      },
    });
  }

  async listar(filtros: { busqueda?: string; ordenarPor?: string; activo?: boolean } = {}) {
    const whereClause: any = {
      activo: filtros.activo ?? true,
    };

    if (filtros.busqueda) {
      whereClause.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { contacto: { contains: filtros.busqueda, mode: 'insensitive' } },
        { telefono: { contains: filtros.busqueda } },
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

    return prisma.proveedor.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });
  }

  async obtenerPorId(id: string) {
    return prisma.proveedor.findUnique({
      where: { id },
    });
  }

  async obtenerPorNombre(nombre: string) {
    return prisma.proveedor.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive',
        },
        activo: true,
      },
    });
  }

  async actualizar(id: string, data: ActualizarProveedorDto) {
    return prisma.proveedor.update({
      where: { id },
      data: {
        nombre: data.nombre,
        contacto: data.contacto,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
      },
    });
  }

  async desactivar(id: string) {
    return prisma.proveedor.update({
      where: { id },
      data: { activo: false },
    });
  }
}

export const proveedorRepository = new ProveedorRepository();
