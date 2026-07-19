import { Categoria } from './categoria.model';

export type UnidadMedida = 'UNIDAD' | 'KG' | 'G' | 'LITRO' | 'ML';

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoriaId?: string;
  codigoBarras: string;
  precioVenta: number;
  costo: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: UnidadMedida;
  activo: boolean;
  imagenUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  categoria?: Categoria;
}

export type CrearProductoDto = Omit<
  Producto,
  'id' | 'activo' | 'createdAt' | 'updatedAt'
>;

export type ActualizarProductoDto = Partial<CrearProductoDto>;

export interface PaginatedProductos {
  productos: Producto[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}
