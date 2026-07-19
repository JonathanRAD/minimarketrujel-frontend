export interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
  createdAt: string;
}

export type CrearProveedorDto = Omit<Proveedor, 'id' | 'activo' | 'createdAt'>;

export type ActualizarProveedorDto = Partial<CrearProveedorDto>;
