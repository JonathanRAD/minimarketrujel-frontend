import { z } from 'zod';

const detalleVentaSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative(),
});

export const crearVentaSchema = z.object({
  id: z.string().uuid().optional(), // permite UUID generado en cliente (offline-first)
  clienteId: z.string().uuid().optional(),
  turnoId: z.string().uuid().optional(),
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'MIXTO', 'FIADO']).default('EFECTIVO'),
  detalles: z.array(detalleVentaSchema).min(1, 'La venta debe tener al menos un producto'),
  montoEfectivo: z.number().nonnegative().optional(),
  montoTarjeta: z.number().nonnegative().optional(),
});

export type CrearVentaDto = z.infer<typeof crearVentaSchema>;

export const filtrarVentasSchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  usuarioId: z.string().uuid().optional(),
  limite: z.coerce.number().optional().default(10),
  pagina: z.coerce.number().optional().default(1),
});

export type FiltrarVentasDto = z.infer<typeof filtrarVentasSchema>;
