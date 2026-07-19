export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  limiteCredito: number;
  activo: boolean;
  createdAt: string;
  deudaTotal: number; // deuda calculada en el backend
}

export interface Fiado {
  id: string;
  clienteId: string;
  ventaId: string;
  monto: number;
  pagado: boolean;
  fechaLimite?: string | null;
  createdAt: string;
  venta?: {
    id: string;
    fecha: string;
    total: number;
    usuario?: {
      nombre: string;
    };
  };
}

export type CrearClienteDto = Omit<Cliente, 'id' | 'activo' | 'createdAt' | 'deudaTotal'>;

export type ActualizarClienteDto = Partial<CrearClienteDto>;

export interface PaginatedClientes {
  clientes: Cliente[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}
