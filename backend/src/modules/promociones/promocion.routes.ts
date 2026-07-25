import { Router } from 'express';
import { promocionController } from './promocion.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(requireAuth);

// Obtener promociones vigentes (accesible por Cajeros y Admins para el POS)
router.get('/vigentes', asyncHandler(promocionController.obtenerVigentes));

// Gestión de promociones (Solo ADMIN)
router.get('/', requireRole('ADMIN'), asyncHandler(promocionController.listar));
router.get('/:id', requireRole('ADMIN'), asyncHandler(promocionController.obtenerPorId));
router.post('/', requireRole('ADMIN'), asyncHandler(promocionController.crear));
router.put('/:id', requireRole('ADMIN'), asyncHandler(promocionController.actualizar));
router.patch('/:id/estado', requireRole('ADMIN'), asyncHandler(promocionController.cambiarEstado));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(promocionController.eliminar));

export default router;
