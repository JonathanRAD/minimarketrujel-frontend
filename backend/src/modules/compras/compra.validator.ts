import { z } from 'zod';

export const crearCompraSchema = z.object({
  proveedorId: z.string().uuid('El ID de proveedor no es válido'),
  estado: z.enum(['PENDIENTE', 'RECIBIDA']).default('RECIBIDA'),
  detalles: z.array(
    z.object({
      productoId: z.string().uuid('El ID de producto no es válido'),
      cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
      costoUnitario: z.number().nonnegative('El costo unitario no puede ser negativo'),
    })
  ).min(1, 'La compra debe tener al menos un producto'),
});

export const actualizarEstadoCompraSchema = z.object({
  estado: z.enum(['PENDIENTE', 'RECIBIDA', 'CANCELADA']),
});

export type CrearCompraDto = z.infer<typeof crearCompraSchema>;
export type ActualizarEstadoCompraDto = z.infer<typeof actualizarEstadoCompraSchema>;

export const filtrarComprasSchema = z.object({
  proveedorId: z.string().uuid().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  limite: z.coerce.number().optional().default(10),
  pagina: z.coerce.number().optional().default(1),
});

export type FiltrarComprasDto = z.infer<typeof filtrarComprasSchema>;
