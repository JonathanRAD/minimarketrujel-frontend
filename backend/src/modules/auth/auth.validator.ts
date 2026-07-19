import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const loginPinSchema = z.object({
  pin: z.string().length(4, 'El PIN debe tener 4 dígitos'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type LoginPinDto = z.infer<typeof loginPinSchema>;
