import { Router } from 'express';
import { authController } from './auth.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { rateLimiter } from '../../common/middlewares/rateLimiter';

const router = Router();

// Límite de 5 intentos por minuto para prevenir ataques de fuerza bruta
const loginLimit = rateLimiter(60_000, 5);

router.post('/login', loginLimit, asyncHandler(authController.login));
router.post('/login-pin', loginLimit, asyncHandler(authController.loginConPin));

export default router;
