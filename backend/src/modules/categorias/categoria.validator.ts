import { z } from 'zod';

export const crearCategoriaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

export const actualizarCategoriaSchema = crearCategoriaSchema.partial();

export type CrearCategoriaDto = z.infer<typeof crearCategoriaSchema>;
export type ActualizarCategoriaDto = z.infer<typeof actualizarCategoriaSchema>;

export const filtrarCategoriasSchema = z.object({
  busqueda: z.string().optional(),
  ordenarPor: z.enum(['reciente', 'antiguo', 'nombre_asc', 'nombre_desc']).optional(),
});

export type FiltrarCategoriasDto = z.infer<typeof filtrarCategoriasSchema>;
