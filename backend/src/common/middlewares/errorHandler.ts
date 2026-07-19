import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';

/**
 * Middleware global de errores. Debe registrarse AL FINAL, después de todas las rutas.
 * Captura: errores de negocio (AppError), errores de validación (Zod) y errores inesperados.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Errores de validación de Zod
  if (err instanceof ZodError) {
    console.error('[ZodError]', JSON.stringify(err.errors, null, 2));
    res.status(422).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      })),
    });
    return;
  }

  // Errores de negocio controlados
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Errores no previstos: se loguean completos pero no se exponen al cliente
  console.error('[ERROR NO CONTROLADO]', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(env.nodeEnv === 'development' && {
      detalle: err instanceof Error ? err.message : String(err),
    }),
  });
}

/**
 * Envuelve controladores async para no repetir try/catch en cada uno.
 * Uso: router.get('/', asyncHandler(controller.listar))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
