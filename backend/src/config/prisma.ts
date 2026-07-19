import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Singleton: evita crear múltiples conexiones en desarrollo (hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.nodeEnv === 'development') {
  global.__prisma = prisma;
}
