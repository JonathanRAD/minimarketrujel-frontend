import { categoriaRepository } from './categoria.repository';
import { CrearCategoriaDto, ActualizarCategoriaDto } from './categoria.validator';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';

export class CategoriaService {
  async crear(data: CrearCategoriaDto) {
    const existente = await categoriaRepository.obtenerPorNombre(data.nombre);
    if (existente) {
      throw new ConflictError('Ya existe una categoría activa con ese nombre');
    }
    return categoriaRepository.crear(data);
  }

  async listar(activo?: boolean) {
    return categoriaRepository.listar(activo !== undefined ? { activo } : {});
  }

  async obtenerPorId(id: string) {
    const categoria = await categoriaRepository.obtenerPorId(id);
    if (!categoria) {
      throw new NotFoundError('Categoría no encontrada');
    }
    return categoria;
  }

  async actualizar(id: string, data: ActualizarCategoriaDto) {
    await this.obtenerPorId(id); // Valida que exista

    if (data.nombre) {
      const existente = await categoriaRepository.obtenerPorNombre(data.nombre);
      if (existente && existente.id !== id) {
        throw new ConflictError('Ya existe otra categoría activa con ese nombre');
      }
    }

    return categoriaRepository.actualizar(id, data);
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id); // Valida que exista y esté activa

    // Validar si tiene productos activos asociados
    const productosAsociados = await categoriaRepository.contarProductosAsociados(id);
    if (productosAsociados > 0) {
      throw new ConflictError(
        `No se puede eliminar la categoría porque tiene ${productosAsociados} producto(s) asociado(s) activo(s)`
      );
    }

    return categoriaRepository.desactivar(id);
  }
}

export const categoriaService = new CategoriaService();
