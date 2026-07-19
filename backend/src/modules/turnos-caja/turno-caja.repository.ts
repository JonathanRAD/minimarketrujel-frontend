import { prisma } from '../../config/prisma';
import { EstadoTurno } from '@prisma/client';
import { FiltrarTurnosDto } from './turno-caja.validator';

export class TurnoCajaRepository {
  async obtenerActivo(usuarioId: string) {
    return prisma.turnoCaja.findFirst({
      where: {
        usuarioId,
        estado: EstadoTurno.ABIERTO,
      },
    });
  }

  async crear(montoInicial: number, usuarioId: string) {
    return prisma.turnoCaja.create({
      data: {
        usuarioId,
        montoInicial,
        estado: EstadoTurno.ABIERTO,
      },
    });
  }

  async cerrar(
    id: string,
    montoFinalReal: number,
    montoFinalEsperado: number,
    diferencia: number,
    auditoriaArqueo: any
  ) {
    return prisma.turnoCaja.update({
      where: { id },
      data: {
        estado: EstadoTurno.CERRADO,
        fechaCierre: new Date(),
        montoFinalEsperado,
        montoFinalReal,
        diferencia,
        auditoriaArqueo,
      },
    });
  }

  async listar(filtros: Partial<FiltrarTurnosDto> = {}) {
    const whereClause: any = {};

    if (filtros.desde || filtros.hasta) {
      whereClause.fechaApertura = {};
      if (filtros.desde) whereClause.fechaApertura.gte = new Date(filtros.desde);
      if (filtros.hasta) whereClause.fechaApertura.lte = new Date(filtros.hasta);
    }

    const limite = filtros.limite ?? 10;
    const pagina = filtros.pagina ?? 1;
    const skip = (pagina - 1) * limite;

    const [total, turnos] = await Promise.all([
      prisma.turnoCaja.count({ where: whereClause }),
      prisma.turnoCaja.findMany({
        where: whereClause,
        include: {
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: {
          fechaApertura: 'desc',
        },
        skip,
        take: limite,
      })
    ]);

    return {
      turnos,
      total,
      pagina,
      limite,
      paginas: Math.ceil(total / limite),
    };
  }

  async obtenerPorId(id: string) {
    return prisma.turnoCaja.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true,
          },
        },
      },
    });
  }
}

export const turnoCajaRepository = new TurnoCajaRepository();
