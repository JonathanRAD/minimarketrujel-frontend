import { proveedorRepository } from './proveedor.repository';
import { CrearProveedorDto, ActualizarProveedorDto } from './proveedor.validator';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';

export class ProveedorService {
  async crear(data: CrearProveedorDto) {
    const existente = await proveedorRepository.obtenerPorNombre(data.nombre);
    if (existente) {
      throw new ConflictError('Ya existe un proveedor activo con ese nombre');
    }
    return proveedorRepository.crear(data);
  }

  async listar() {
    return proveedorRepository.listar({ activo: true });
  }

  async obtenerPorId(id: string) {
    const proveedor = await proveedorRepository.obtenerPorId(id);
    if (!proveedor || !proveedor.activo) {
      throw new NotFoundError('Proveedor no encontrado');
    }
    return proveedor;
  }

  async actualizar(id: string, data: ActualizarProveedorDto) {
    await this.obtenerPorId(id); // valida existencia

    if (data.nombre) {
      const existente = await proveedorRepository.obtenerPorNombre(data.nombre);
      if (existente && existente.id !== id) {
        throw new ConflictError('Ya existe otro proveedor activo con ese nombre');
      }
    }

    return proveedorRepository.actualizar(id, data);
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id); // valida existencia
    return proveedorRepository.desactivar(id);
  }
}

export const proveedorService = new ProveedorService();
