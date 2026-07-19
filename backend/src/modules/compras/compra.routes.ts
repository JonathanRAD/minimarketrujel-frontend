import { Router } from 'express';
import { compraController } from './compra.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de compras requieren estar autenticado
router.use(requireAuth);

router.get('/', asyncHandler(compraController.listar));
router.get('/:id', asyncHandler(compraController.obtenerPorId));

// Solo ADMIN puede registrar compras o cambiar su estado
router.post('/', requireRole('ADMIN'), asyncHandler(compraController.crear));
router.put('/:id/estado', requireRole('ADMIN'), asyncHandler(compraController.actualizarEstado));

export default router;
