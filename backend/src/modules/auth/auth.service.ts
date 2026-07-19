import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../common/errors/AppError';
import { LoginDto, LoginPinDto } from './auth.validator';

export class AuthService {
  async login(data: LoginDto) {
    const usuario = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(data.password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    return this.generarRespuestaAuth(usuario.id, usuario.nombre, usuario.email, usuario.rol);
  }

  /** Login rápido con PIN de 4 dígitos, pensado para la pantalla POS en tablet */
  async loginConPin(data: LoginPinDto) {
    const usuario = await prisma.usuario.findUnique({ where: { pin: data.pin } });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedError('PIN inválido');
    }
    return this.generarRespuestaAuth(usuario.id, usuario.nombre, usuario.email, usuario.rol);
  }

  private generarRespuestaAuth(
    id: string,
    nombre: string,
    email: string,
    rol: 'ADMIN' | 'CAJERO',
  ) {
    const token = jwt.sign({ id, email, rol }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as any,
    });
    return { token, usuario: { id, nombre, email, rol } };
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
}

export const authService = new AuthService();
