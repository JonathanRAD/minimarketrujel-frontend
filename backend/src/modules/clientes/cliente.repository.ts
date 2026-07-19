import { prisma } from '../../config/prisma';
import { CrearClienteDto, ActualizarClienteDto, FiltrarClientesDto } from './cliente.validator';

export class ClienteRepository {
  async crear(data: CrearClienteDto) {
    return prisma.cliente.create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono || null,
        direccion: data.direccion || null,
        limiteCredito: data.limiteCredito,
      },
    });
  }

  async listar(filtros: Partial<FiltrarClientesDto> & { activo?: boolean } = {}) {
    const whereClause: any = {
      activo: filtros.activo ?? true,
    };

    if (filtros.busqueda) {
      whereClause.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { telefono: { contains: filtros.busqueda } },
      ];
    }

    if (filtros.todo === true) {
      const clientes = await prisma.cliente.findMany({
        where: whereClause,
        orderBy: { nombre: 'asc' },
      });
      return {
        clientes,
        total: clientes.length,
        pagina: 1,
        limite: clientes.length,
        paginas: 1,
      };
    }

    const limite = filtros.limite ?? 10;
    const pagina = filtros.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    const [total, clientes] = await Promise.all([
      prisma.cliente.count({ where: whereClause }),
      prisma.cliente.findMany({
        where: whereClause,
        orderBy: { nombre: 'asc' },
        skip,
        take: limite,
      })
    ]);

    return {
      clientes,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    };
  }

  async obtenerPorId(id: string) {
    return prisma.cliente.findUnique({
      where: { id },
    });
  }

  async obtenerPorNombre(nombre: string) {
    return prisma.cliente.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive',
        },
        activo: true,
      },
    });
  }

  async actualizar(id: string, data: ActualizarClienteDto) {
    return prisma.cliente.update({
      where: { id },
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        limiteCredito: data.limiteCredito,
      },
    });
  }

  async desactivar(id: string) {
    return prisma.cliente.update({
      where: { id },
      data: { activo: false },
    });
  }

  // --- MÉTODOS DE FIADOS ---

  async obtenerFiadoPorId(id: string) {
    return prisma.fiado.findUnique({
      where: { id },
    });
  }

  async listarFiadosPendientes(clienteId: string) {
    return prisma.fiado.findMany({
      where: {
        clienteId,
        pagado: false,
      },
      include: {
        venta: {
          select: {
            id: true,
            fecha: true,
            total: true,
            usuario: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async actualizarEstadoFiado(fiadoId: string, pagado: boolean) {
    return prisma.fiado.update({
      where: { id: fiadoId },
      data: { pagado },
    });
  }

  async obtenerDeudaTotal(clienteId: string): Promise<number> {
    const agregacion = await prisma.fiado.aggregate({
      where: {
        clienteId,
        pagado: false,
      },
      _sum: {
        monto: true,
      },
    });
    
    // Prisma Decimal a number
    return agregacion._sum.monto ? Number(agregacion._sum.monto) : 0;
  }
}

export const clienteRepository = new ClienteRepository();
