export type EstadoCompra = 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';

export interface CompraDetalle {
  id: string;
  compraId: string;
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  producto?: {
    nombre: string;
    codigoBarras: string;
  };
}

export interface Compra {
  id: string;
  proveedorId: string;
  usuarioId: string;
  fecha: string;
  total: number;
  estado: EstadoCompra;
  createdAt: string;
  proveedor?: {
    nombre: string;
    contacto?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
  };
  usuario?: {
    nombre: string;
    email: string;
  };
  detalles?: CompraDetalle[];
}

export interface CrearCompraDetalleDto {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
}

export interface CrearCompraDto {
  proveedorId: string;
  estado: EstadoCompra;
  detalles: CrearCompraDetalleDto[];
}

export interface PaginatedCompras {
  compras: Compra[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}
