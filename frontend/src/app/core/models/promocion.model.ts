export type TipoPromocion = 'PORCENTAJE' | 'PRECIO_FIJO' | 'PROMO_NXM' | 'VOLUMEN';

export interface Promocion {
  id: string;
  titulo: string;
  descripcion?: string | null;
  tipo: TipoPromocion;
  productoId?: string | null;
  categoriaId?: string | null;
  valorDescuento?: number | null;
  cantidadMinima: number;
  cantidadGratis?: number | null;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;

  producto?: {
    id: string;
    nombre: string;
    codigoBarras: string;
    precioVenta: number;
    categoriaId?: string | null;
  } | null;

  categoria?: {
    id: string;
    nombre: string;
  } | null;
}

export interface CrearPromocionDto {
  titulo: string;
  descripcion?: string;
  tipo: TipoPromocion;
  productoId?: string | null;
  categoriaId?: string | null;
  valorDescuento?: number | null;
  cantidadMinima?: number;
  cantidadGratis?: number | null;
  fechaInicio: string;
  fechaFin: string;
  activo?: boolean;
}

export interface ActualizarPromocionDto extends Partial<CrearPromocionDto> {}

export interface PaginatedPromociones {
  promociones: Promocion[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}
