import { z } from 'zod';

export const crearClienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  limiteCredito: z.number().nonnegative('El límite de crédito no puede ser negativo').default(0),
});

export const actualizarClienteSchema = crearClienteSchema.partial();

export type CrearClienteDto = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteDto = z.infer<typeof actualizarClienteSchema>;
export type RegistrarPagoFiadoDto = {
  fiadoId: string;
};

export const filtrarClientesSchema = z.object({
  busqueda: z.string().optional(),
  limite: z.coerce.number().optional().default(10),
  pagina: z.coerce.number().optional().default(1),
  todo: z.preprocess((val) => val === 'true', z.boolean().optional()),
});

export type FiltrarClientesDto = z.infer<typeof filtrarClientesSchema>;
