import { clienteRepository } from './cliente.repository';
import { CrearClienteDto, ActualizarClienteDto, FiltrarClientesDto } from './cliente.validator';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';

export class ClienteService {
  async crear(data: CrearClienteDto) {
    const existente = await clienteRepository.obtenerPorNombre(data.nombre);
    if (existente) {
      throw new ConflictError('Ya existe un cliente activo con ese nombre');
    }
    return clienteRepository.crear(data);
  }

  async listar(filtros: Partial<FiltrarClientesDto> = {}) {
    const res = await clienteRepository.listar({ activo: true, ...filtros });
    
    // Adjuntamos la deuda total acumulada a cada cliente para facilitar el control en frontend
    const clientesConDeuda = await Promise.all(
      res.clientes.map(async (c) => {
        const deudaTotal = await clienteRepository.obtenerDeudaTotal(c.id);
        return {
          ...c,
          deudaTotal,
        };
      })
    );

    return {
      clientes: clientesConDeuda,
      total: res.total,
      pagina: res.pagina,
      limite: res.limite,
      paginas: res.paginas,
    };
  }

  async obtenerPorId(id: string) {
    const cliente = await clienteRepository.obtenerPorId(id);
    if (!cliente || !cliente.activo) {
      throw new NotFoundError('Cliente no encontrado');
    }
    
    const deudaTotal = await clienteRepository.obtenerDeudaTotal(id);
    return {
      ...cliente,
      deudaTotal,
    };
  }

  async actualizar(id: string, data: ActualizarClienteDto) {
    await this.obtenerPorId(id); // Valida que exista y esté activo

    if (data.nombre) {
      const existente = await clienteRepository.obtenerPorNombre(data.nombre);
      if (existente && existente.id !== id) {
        throw new ConflictError('Ya existe otro cliente activo con ese nombre');
      }
    }

    return clienteRepository.actualizar(id, data);
  }

  async eliminar(id: string) {
    const cliente = await this.obtenerPorId(id); // Valida existencia

    // Validar si tiene deudas pendientes
    if (cliente.deudaTotal > 0) {
      throw new ConflictError(
        `No se puede eliminar el cliente porque tiene una deuda pendiente de $${cliente.deudaTotal}`
      );
    }

    return clienteRepository.desactivar(id);
  }

  // --- SERVICIOS DE FIADOS ---

  async listarFiadosPendientes(clienteId: string) {
    await this.obtenerPorId(clienteId); // valida existencia
    return clienteRepository.listarFiadosPendientes(clienteId);
  }

  async pagarFiado(fiadoId: string) {
    const fiado = await clienteRepository.obtenerFiadoPorId(fiadoId);
    if (!fiado) {
      throw new NotFoundError('Registro de fiado no encontrado');
    }
    if (fiado.pagado) {
      throw new ConflictError('Este fiado ya se encuentra pagado');
    }

    return clienteRepository.actualizarEstadoFiado(fiadoId, true);
  }
}

export const clienteService = new ClienteService();
