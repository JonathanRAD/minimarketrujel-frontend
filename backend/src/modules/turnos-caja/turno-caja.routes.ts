import { Router } from 'express';
import { turnoCajaController } from './turno-caja.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de turnos de caja requieren estar autenticado
router.use(requireAuth);

router.get('/activo', asyncHandler(turnoCajaController.obtenerActivo));
router.post('/apertura', asyncHandler(turnoCajaController.abrirCaja));
router.post('/cierre', asyncHandler(turnoCajaController.cerrarCaja));

// Solo ADMIN puede consultar el historial general de arqueos de caja
router.get('/', requireRole('ADMIN'), asyncHandler(turnoCajaController.listar));

export default router;
