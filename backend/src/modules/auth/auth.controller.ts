import { Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema, loginPinSchema } from './auth.validator';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const data = loginSchema.parse(req.body);
    const resultado = await authService.login(data);
    res.json({ success: true, data: resultado });
  }

  async loginConPin(req: Request, res: Response): Promise<void> {
    const data = loginPinSchema.parse(req.body);
    const resultado = await authService.loginConPin(data);
    res.json({ success: true, data: resultado });
  }
}

export const authController = new AuthController();
