export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  createdAt: string;
}

export type CrearCategoriaDto = Omit<Categoria, 'id' | 'createdAt'>;

export type ActualizarCategoriaDto = Partial<CrearCategoriaDto>;
