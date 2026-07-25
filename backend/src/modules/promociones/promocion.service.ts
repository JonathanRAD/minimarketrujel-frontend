import { promocionRepository } from './promocion.repository';
import { CrearPromocionDto, ActualizarPromocionDto, FiltrarPromocionesDto } from './promocion.validator';
import { NotFoundError } from '../../common/errors/AppError';

export class PromocionService {
  async crear(data: CrearPromocionDto) {
    return promocionRepository.crear(data);
  }

  async listar(filtros: Partial<FiltrarPromocionesDto> = {}) {
    return promocionRepository.listar(filtros);
  }

  async obtenerPorId(id: string) {
    const promo = await promocionRepository.obtenerPorId(id);
    if (!promo) throw new NotFoundError('Promoción no encontrada');
    return promo;
  }

  async obtenerVigentes() {
    return promocionRepository.obtenerPromocionesVigentes();
  }

  async actualizar(id: string, data: ActualizarPromocionDto) {
    await this.obtenerPorId(id);
    return promocionRepository.actualizar(id, data);
  }

  async cambiarEstado(id: string, activo: boolean) {
    await this.obtenerPorId(id);
    return promocionRepository.cambiarEstado(id, activo);
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    return promocionRepository.eliminar(id);
  }
}

export const promocionService = new PromocionService();
