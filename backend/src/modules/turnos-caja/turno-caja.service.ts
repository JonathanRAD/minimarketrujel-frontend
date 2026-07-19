import { turnoCajaRepository } from './turno-caja.repository';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';
import { FiltrarTurnosDto } from './turno-caja.validator';

export class TurnoCajaService {
  async obtenerActivo(usuarioId: string) {
    const turno = await turnoCajaRepository.obtenerActivo(usuarioId);
    if (!turno) return null;

    // Calcular ventas en efectivo reales durante este turno
    const agregacionEfectivo = await prisma.venta.aggregate({
      where: {
        turnoId: turno.id,
        estado: 'COMPLETADA',
      },
      _sum: {
        montoEfectivo: true,
      },
    });

    // Calcular ventas en tarjeta reales durante este turno
    const agregacionTarjeta = await prisma.venta.aggregate({
      where: {
        turnoId: turno.id,
        estado: 'COMPLETADA',
      },
      _sum: {
        montoTarjeta: true,
      },
    });

    const ventasEfectivo = Number(agregacionEfectivo._sum.montoEfectivo || 0);
    const ventasTarjeta = Number(agregacionTarjeta._sum.montoTarjeta || 0);
    const montoFinalEsperado = Number(turno.montoInicial) + ventasEfectivo + ventasTarjeta;

    return {
      ...turno,
      ventasEfectivo,
      ventasTarjeta,
      montoFinalEsperado,
    };
  }

  async abrirCaja(montoInicial: number, usuarioId: string) {
    const activo = await turnoCajaRepository.obtenerActivo(usuarioId);
    if (activo) {
      throw new BadRequestError('Ya tienes un turno de caja abierto actualmente');
    }

    return turnoCajaRepository.crear(montoInicial, usuarioId);
  }

  async cerrarCaja(
    usuarioId: string,
    data: {
      montoFinalReal: number;
      efectivoReal: number;
      tarjetaReal: number;
      conteoMonedasBilletes?: any;
    }
  ) {
    const turnoActivo = await this.obtenerActivo(usuarioId);
    if (!turnoActivo) {
      throw new BadRequestError('No se encontró ningún turno de caja activo para cerrar');
    }

    const efectivoEsperado = Number(turnoActivo.montoInicial) + Number(turnoActivo.ventasEfectivo);
    const tarjetaEsperada = Number(turnoActivo.ventasTarjeta);
    const montoFinalEsperado = efectivoEsperado + tarjetaEsperada;

    const diferenciaEfectivo = Number((data.efectivoReal - efectivoEsperado).toFixed(2));
    const diferenciaTarjeta = Number((data.tarjetaReal - tarjetaEsperada).toFixed(2));
    const diferenciaTotal = Number((data.montoFinalReal - montoFinalEsperado).toFixed(2));

    const auditoriaArqueo = {
      efectivoEsperado,
      tarjetaEsperada,
      efectivoReal: data.efectivoReal,
      tarjetaReal: data.tarjetaReal,
      diferenciaEfectivo,
      diferenciaTarjeta,
      conteoMonedasBilletes: data.conteoMonedasBilletes || null,
    };

    return turnoCajaRepository.cerrar(
      turnoActivo.id,
      data.montoFinalReal,
      montoFinalEsperado,
      diferenciaTotal,
      auditoriaArqueo
    );
  }

  async listar(filtros: Partial<FiltrarTurnosDto> = {}) {
    return turnoCajaRepository.listar(filtros);
  }
}

export const turnoCajaService = new TurnoCajaService();
