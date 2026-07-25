import { z } from 'zod';

export const crearPromocionSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(['PORCENTAJE', 'PRECIO_FIJO', 'PROMO_NXM', 'VOLUMEN']),
  productoId: z.string().uuid().optional().nullable(),
  categoriaId: z.string().uuid().optional().nullable(),
  valorDescuento: z.number().nonnegative().optional().nullable(),
  cantidadMinima: z.number().int().positive().default(1),
  cantidadGratis: z.number().int().nonnegative().optional().nullable(),
  fechaInicio: z.string().datetime().or(z.string().min(10)),
  fechaFin: z.string().datetime().or(z.string().min(10)),
  activo: z.boolean().optional().default(true),
}).refine(
  (data) => data.productoId || data.categoriaId,
  {
    message: 'Debes seleccionar al menos un producto o una categoría para la promoción',
    path: ['productoId'],
  }
);

export const actualizarPromocionSchema = z.object({
  titulo: z.string().min(3).optional(),
  descripcion: z.string().optional().nullable(),
  tipo: z.enum(['PORCENTAJE', 'PRECIO_FIJO', 'PROMO_NXM', 'VOLUMEN']).optional(),
  productoId: z.string().uuid().optional().nullable(),
  categoriaId: z.string().uuid().optional().nullable(),
  valorDescuento: z.number().nonnegative().optional().nullable(),
  cantidadMinima: z.number().int().positive().optional(),
  cantidadGratis: z.number().int().nonnegative().optional().nullable(),
  fechaInicio: z.string().datetime().or(z.string().min(10)).optional(),
  fechaFin: z.string().datetime().or(z.string().min(10)).optional(),
  activo: z.boolean().optional(),
});

export const filtrarPromocionesSchema = z.object({
  busqueda: z.string().optional(),
  activo: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
  ordenarPor: z.enum(['reciente', 'antiguo', 'vencimiento_asc', 'vencimiento_desc', 'titulo_asc']).optional(),
  limite: z.coerce.number().optional().default(10),
  pagina: z.coerce.number().optional().default(1),
});

export type CrearPromocionDto = z.infer<typeof crearPromocionSchema>;
export type ActualizarPromocionDto = z.infer<typeof actualizarPromocionSchema>;
export type FiltrarPromocionesDto = z.infer<typeof filtrarPromocionesSchema>;
