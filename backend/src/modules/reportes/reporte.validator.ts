import { z } from 'zod';

export const consultaReporteSchema = z.object({
  fechaInicio: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  fechaFin: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

export type ConsultaReporteDto = z.infer<typeof consultaReporteSchema>;
