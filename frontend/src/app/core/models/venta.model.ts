import { Producto } from './producto.model';
import { Cliente } from './cliente.model';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'MIXTO' | 'FIADO';

export interface DetalleVentaDto {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearVentaDto {
  id?: string; // UUID generado en el cliente (clave para modo offline)
  clienteId?: string;
  turnoId?: string;
  metodoPago: MetodoPago;
  detalles: DetalleVentaDto[];
  montoEfectivo?: number;
  montoTarjeta?: number;
}

export interface VentaDetalle {
  id: string;
  ventaId: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto: Producto;
}

export interface Venta {
  id: string;
  usuarioId: string;
  clienteId?: string;
  fecha: string;
  total: number;
  metodoPago: MetodoPago;
  montoEfectivo?: number;
  montoTarjeta?: number;
  estado: 'COMPLETADA' | 'ANULADA';
  sincronizado: boolean;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
  };
  cliente?: Cliente;
  detalles?: VentaDetalle[];
}

/** Item en el carrito de la pantalla de venta (antes de confirmar el cobro) */
export interface ItemCarrito {
  producto: {
    id: string;
    nombre: string;
    codigoBarras: string;
    precioVenta: number;
    unidadMedida?: string;
  };
  cantidad: number;
  subtotal: number;
}

export interface PaginatedVentas {
  ventas: Venta[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}
