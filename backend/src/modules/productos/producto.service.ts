import { productoRepository } from './producto.repository';
import { CrearProductoDto, ActualizarProductoDto, FiltrarProductosDto } from './producto.validator';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';
import { prisma } from '../../config/prisma';

/**
 * Capa de lógica de negocio. No conoce Express ni Prisma directamente,
 * solo usa el repositorio. Esto la hace fácil de testear.
 */
export class ProductoService {
  private normalizarNombre(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  private async generarCodigoInterno(): Promise<string> {
    let codigo = '';
    let existe = true;
    while (existe) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      codigo = `SC-${randomNum}`;
      const p = await productoRepository.obtenerPorCodigoBarras(codigo);
      if (!p) existe = false;
    }
    return codigo;
  }

  async crear(data: CrearProductoDto) {
    if (!data.codigoBarras || data.codigoBarras.trim() === '') {
      data.codigoBarras = await this.generarCodigoInterno();
    } else {
      const existente = await productoRepository.obtenerPorCodigoBarras(data.codigoBarras);
      if (existente) {
        throw new ConflictError('Ya existe un producto con ese código de barras');
      }
    }

    // Validación de nombre duplicado (normalización: sin acentos, mayúsculas, espacios simples)
    // NOTA FUTURA: Si el catálogo crece a miles de registros, conviene mover esta comparación
    // a la base de datos con una columna normalizada indexada (`nombre_normalizado`) en vez de
    // traer los nombres a memoria en el servidor.
    const nombreNorm = this.normalizarNombre(data.nombre);
    const productosExistentes = await prisma.producto.findMany({ select: { id: true, nombre: true } });
    const conflictoNombre = productosExistentes.find((p) => this.normalizarNombre(p.nombre) === nombreNorm);
    if (conflictoNombre) {
      throw new ConflictError(`Ya existe un producto registrado con un nombre equivalente ("${conflictoNombre.nombre}")`);
    }

    return productoRepository.crear(data as any);
  }

  async listar(filtros: Partial<FiltrarProductosDto> = {}) {
    return productoRepository.listar({ activo: true, ...filtros });
  }

  async obtenerPorId(id: string) {
    const producto = await productoRepository.obtenerPorId(id);
    if (!producto) throw new NotFoundError('Producto');
    return producto;
  }

  /** Usado por la pantalla de venta: al escanear, se busca directo por código de barras */
  async buscarPorCodigoBarras(codigo: string) {
    const producto = await productoRepository.obtenerPorCodigoBarras(codigo);
    if (!producto) throw new NotFoundError('Producto con ese código de barras');
    return producto;
  }

  async actualizar(id: string, data: ActualizarProductoDto) {
    await this.obtenerPorId(id); // valida que exista
    if (data.codigoBarras && data.codigoBarras.trim() !== '') {
      const conflicto = await productoRepository.obtenerPorCodigoBarras(data.codigoBarras);
      if (conflicto && conflicto.id !== id) {
        throw new ConflictError('Ese código de barras ya está en uso por otro producto');
      }
    }

    if (data.nombre && data.nombre.trim() !== '') {
      const nombreNorm = this.normalizarNombre(data.nombre);
      const otrosProductos = await prisma.producto.findMany({
        where: { id: { not: id } },
        select: { id: true, nombre: true },
      });
      const conflictoNombre = otrosProductos.find((p) => this.normalizarNombre(p.nombre) === nombreNorm);
      if (conflictoNombre) {
        throw new ConflictError(`Ya existe otro producto registrado con un nombre equivalente ("${conflictoNombre.nombre}")`);
      }
    }

    return productoRepository.actualizar(id, data);
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);

    // Validar si tiene historial asociado
    const ventasAsociadas = await prisma.ventaDetalle.count({ where: { productoId: id } });
    const comprasAsociadas = await prisma.compraDetalle.count({ where: { productoId: id } });
    const movimientosAsociados = await prisma.movimientoInventario.count({ where: { productoId: id } });

    if (ventasAsociadas > 0 || comprasAsociadas > 0 || movimientosAsociados > 0) {
      throw new ConflictError(
        'No se puede eliminar físicamente el producto porque tiene historial de ventas, compras o movimientos en el inventario. Si no deseas venderlo más, puedes desactivarlo editándolo.'
      );
    }

    return productoRepository.eliminarFisico(id);
  }

  async listarStockBajo() {
    return productoRepository.listarStockBajo();
  }
}

export const productoService = new ProductoService();
