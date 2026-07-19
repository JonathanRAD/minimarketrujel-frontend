import { ventaRepository } from './venta.repository';
import { productoRepository } from '../productos/producto.repository';
import { CrearVentaDto, FiltrarVentasDto } from './venta.validator';
import { NotFoundError, ValidationError, BadRequestError } from '../../common/errors/AppError';
import { prisma } from '../../config/prisma';
import { emailService } from '../../common/services/email.service';

export class VentaService {
  async crear(usuarioId: string, data: CrearVentaDto) {
    // 1. Validar que el usuario tenga un turno de caja abierto
    const turnoActivo = await prisma.turnoCaja.findFirst({
      where: {
        usuarioId,
        estado: 'ABIERTO',
      },
    });
    if (!turnoActivo) {
      throw new BadRequestError('Debes abrir un turno de caja antes de poder registrar ventas');
    }

    // 2. Validar montos del desglose de pago mixto o simple
    let montoEfectivo = 0;
    let montoTarjeta = 0;

    const totalCalculado = data.detalles.reduce(
      (acc, d) => acc + d.cantidad * d.precioUnitario,
      0
    );

    if (data.metodoPago === 'MIXTO') {
      if (data.montoEfectivo === undefined || data.montoTarjeta === undefined) {
        throw new BadRequestError('Para un pago mixto debes especificar montoEfectivo y montoTarjeta');
      }
      const sumaMetodos = Number(data.montoEfectivo) + Number(data.montoTarjeta);
      if (Math.abs(sumaMetodos - totalCalculado) > 0.01) {
        throw new BadRequestError(
          `La suma de efectivo (S/ ${data.montoEfectivo}) y tarjeta (S/ ${data.montoTarjeta}) debe ser igual al total de la venta (S/ ${totalCalculado.toFixed(2)})`
        );
      }
      montoEfectivo = Number(data.montoEfectivo);
      montoTarjeta = Number(data.montoTarjeta);
    } else if (data.metodoPago === 'EFECTIVO') {
      montoEfectivo = totalCalculado;
      montoTarjeta = 0;
    } else if (data.metodoPago === 'TARJETA') {
      montoEfectivo = 0;
      montoTarjeta = totalCalculado;
    } else {
      // FIADO
      montoEfectivo = 0;
      montoTarjeta = 0;
    }

    const venta = await ventaRepository.crearConTransaccion({
      id: data.id,
      usuarioId,
      clienteId: data.clienteId,
      turnoId: data.turnoId,
      metodoPago: data.metodoPago,
      montoEfectivo,
      montoTarjeta,
      detalles: data.detalles,
    });

    // Enviar notificación de comprobante por email al administrador
    this.enviarComprobantePorEmail(venta.id).catch((err) => {
      console.error('Error al enviar el comprobante por email:', err);
    });

    // Verificar si algún producto cayó por debajo del stock mínimo
    this.verificarAlertasStock(data.detalles).catch((err) => {
      console.error('Error al verificar alertas de stock:', err);
    });

    return venta;
  }

  async listar(filtros: Partial<FiltrarVentasDto> = {}) {
    return ventaRepository.listar(filtros);
  }

  async obtenerPorId(id: string) {
    const venta = await ventaRepository.obtenerPorId(id);
    if (!venta) throw new NotFoundError('Venta');
    return venta;
  }

  async anular(id: string, usuarioId: string) {
    await this.obtenerPorId(id);
    const ventaAnulada = await ventaRepository.anular(id, usuarioId);

    // Enviar notificación de anulación por email al administrador
    this.enviarComprobantePorEmail(id).catch((err) => {
      console.error('Error al enviar el correo de anulación:', err);
    });

    return ventaAnulada;
  }

  private async enviarComprobantePorEmail(ventaId: string) {
    try {
      const ventaCompleta = await ventaRepository.obtenerPorId(ventaId);
      if (ventaCompleta) {
        await emailService.enviarComprobante(ventaCompleta);
      }
    } catch (err) {
      console.error('Error al enviar comprobante de venta:', err);
    }
  }

  private async verificarAlertasStock(detalles: { productoId: string }[]) {
    try {
      const productosBajos = [];
      for (const d of detalles) {
        const prod = await productoRepository.obtenerPorId(d.productoId);
        if (prod && Number(prod.stockActual) <= Number(prod.stockMinimo)) {
          productosBajos.push({
            nombre: prod.nombre,
            codigoBarras: prod.codigoBarras,
            stockActual: Number(prod.stockActual),
            stockMinimo: Number(prod.stockMinimo),
            unidadMedida: prod.unidadMedida,
          });
        }
      }
      if (productosBajos.length > 0) {
        await emailService.enviarAlertaStock(productosBajos);
      }
    } catch (err) {
      console.error('Error en verificarAlertasStock:', err);
    }
  }
}

export const ventaService = new VentaService();
