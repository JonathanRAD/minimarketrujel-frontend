import { z } from 'zod';

export const aperturaTurnoSchema = z.object({
  montoInicial: z.number().min(0, 'El monto inicial no puede ser negativo'),
});

export const cierreTurnoSchema = z.object({
  montoFinalReal: z.number().min(0, 'El monto real contado no puede ser negativo'),
  efectivoReal: z.number().min(0, 'El efectivo real no puede ser negativo'),
  tarjetaReal: z.number().min(0, 'La tarjeta real no puede ser negativo'),
  conteoMonedasBilletes: z.object({
    b200: z.number().int().nonnegative().optional(),
    b100: z.number().int().nonnegative().optional(),
    b50: z.number().int().nonnegative().optional(),
    b20: z.number().int().nonnegative().optional(),
    b10: z.number().int().nonnegative().optional(),
    m5: z.number().int().nonnegative().optional(),
    m2: z.number().int().nonnegative().optional(),
    m1: z.number().int().nonnegative().optional(),
    m050: z.number().int().nonnegative().optional(),
    m020: z.number().int().nonnegative().optional(),
    m010: z.number().int().nonnegative().optional(),
  }).optional(),
});

export type AperturaTurnoDto = z.infer<typeof aperturaTurnoSchema>;
export type CierreTurnoDto = z.infer<typeof cierreTurnoSchema>;

export const filtrarTurnosSchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  limite: z.coerce.number().optional().default(10),
  pagina: z.coerce.number().optional().default(1),
});

export type FiltrarTurnosDto = z.infer<typeof filtrarTurnosSchema>;
