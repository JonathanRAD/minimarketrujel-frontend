export type TipoMovimiento = 'VENTA' | 'COMPRA' | 'AJUSTE' | 'MERMA' | 'DEVOLUCION';

export interface MovimientoInventario {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string | null;
  usuarioId: string;
  referenciaId?: string | null;
  fecha: string;
  producto?: {
    nombre: string;
    codigoBarras: string;
  };
  usuario?: {
    nombre: string;
  };
}

export type TipoAjuste = 'AJUSTE' | 'MERMA' | 'DEVOLUCION';

export interface CrearAjusteDto {
  productoId: string;
  tipo: TipoAjuste;
  cantidad: number;
  motivo: string;
}

export interface FiltrarMovimientosDto {
  productoId?: string;
  tipo?: TipoMovimiento;
  fechaInicio?: string;
  fechaFin?: string;
  limite?: number;
  pagina?: number;
}

export interface PaginatedMovimientos {
  movimientos: MovimientoInventario[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}
