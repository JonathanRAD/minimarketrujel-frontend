import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { RolUsuario } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  rol: RolUsuario;
}

// Extiende el Request de Express para incluir el usuario autenticado
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

/** Verifica que exista un JWT válido en el header Authorization */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token no proporcionado');
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    throw new UnauthorizedError('Token inválido o expirado');
  }
}

/** Restringe el acceso solo a ciertos roles. Uso: requireRole('ADMIN') */
export function requireRole(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      throw new UnauthorizedError();
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      throw new ForbiddenError();
    }
    next();
  };
}
