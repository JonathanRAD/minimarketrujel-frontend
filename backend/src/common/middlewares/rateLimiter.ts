import { Request, Response, NextFunction } from 'express';

interface LimiteIP {
  intentos: number;
  expira: number;
}

const cache = new Map<string, LimiteIP>();

// Limpieza periódica de registros expirados cada 5 minutos para evitar acumulación de memoria
const cleanupTimer = setInterval(() => {
  const ahora = Date.now();
  for (const [ip, reg] of cache.entries()) {
    if (ahora > reg.expira) {
      cache.delete(ip);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

/**
 * Middleware simple de rate limiting en memoria.
 * Bloquea temporalmente peticiones desde una misma IP si superan el máximo permitido.
 * @param duracionMs Tiempo en milisegundos que dura el bloqueo (ej: 60_000ms = 1 minuto).
 * @param maxIntentos Número máximo de peticiones permitidas en la duración.
 */
export function rateLimiter(duracionMs = 60_000, maxIntentos = 5) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ahora = Date.now();
    const registro = cache.get(ip);

    if (!registro) {
      cache.set(ip, { intentos: 1, expira: ahora + duracionMs });
      return next();
    }

    if (ahora > registro.expira) {
      cache.set(ip, { intentos: 1, expira: ahora + duracionMs });
      return next();
    }

    registro.intentos++;
    if (registro.intentos > maxIntentos) {
      const tiempoRestante = Math.ceil((registro.expira - ahora) / 1000);
      res.status(429).json({
        success: false,
        message: `Demasiados intentos de acceso. Por favor, inténtalo de nuevo en ${tiempoRestante} segundos.`,
      });
      return;
    }

    next();
  };
}
