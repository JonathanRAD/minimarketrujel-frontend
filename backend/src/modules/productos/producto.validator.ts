import { z } from 'zod';

export const crearProductoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  categoriaId: z.string().nullable().optional(),
  codigoBarras: z.string().min(3, 'Código de barras inválido'),
  precioVenta: z.number().positive('El precio debe ser mayor a 0'),
  costo: z.number().nonnegative('El costo no puede ser negativo'),
  stockActual: z.number().nonnegative().default(0),
  stockMinimo: z.number().nonnegative().default(5),
  unidadMedida: z.enum(['UNIDAD', 'KG', 'G', 'LITRO', 'ML']).default('UNIDAD'),
  imagenUrl: z.string().nullable().optional(),
});

export const actualizarProductoSchema = crearProductoSchema.partial();

export const buscarPorCodigoBarrasSchema = z.object({
  codigo: z.string().min(1),
});

export type CrearProductoDto = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoDto = z.infer<typeof actualizarProductoSchema>;

export const filtrarProductosSchema = z.object({
  categoriaId: z.string().uuid().optional(),
  busqueda: z.string().optional(),
  limite: z.coerce.number().optional().default(10),
  pagina: z.coerce.number().optional().default(1),
  todo: z.preprocess((val) => val === 'true', z.boolean().optional()),
});

export type FiltrarProductosDto = z.infer<typeof filtrarProductosSchema>;
