import { z } from 'zod';

export const crearProveedorSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  contacto: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email('El correo electrónico no es válido').optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
});

export const actualizarProveedorSchema = crearProveedorSchema.partial();

export type CrearProveedorDto = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorDto = z.infer<typeof actualizarProveedorSchema>;
