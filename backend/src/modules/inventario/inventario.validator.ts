import { z } from 'zod';

export const crearAjusteSchema = z.object({
  productoId: z.string().uuid('El ID de producto no es válido'),
  tipo: z.enum(['AJUSTE', 'MERMA', 'DEVOLUCION']),
  cantidad: z.number().refine((n) => n !== 0, 'La cantidad de ajuste no puede ser cero'),
  motivo: z.string().min(5, 'El motivo del ajuste debe tener al menos 5 caracteres'),
});

export const filtrarMovimientosSchema = z.object({
  productoId: z.string().uuid().optional(),
  tipo: z.enum(['VENTA', 'COMPRA', 'AJUSTE', 'MERMA', 'DEVOLUCION']).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  limite: z.coerce.number().optional().default(10),
  pagina: z.coerce.number().optional().default(1),
});

export type CrearAjusteDto = z.infer<typeof crearAjusteSchema>;
export type FiltrarMovimientosDto = z.infer<typeof filtrarMovimientosSchema>;
