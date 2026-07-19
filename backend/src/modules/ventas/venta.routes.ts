import { Router } from 'express';
import { ventaController } from './venta.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', asyncHandler(ventaController.crear));
router.get('/', asyncHandler(ventaController.listar));
router.get('/:id', asyncHandler(ventaController.obtenerPorId));
router.post('/:id/anular', requireRole('ADMIN'), asyncHandler(ventaController.anular));

export default router;
