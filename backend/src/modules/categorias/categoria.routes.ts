import { Router } from 'express';
import { categoriaController } from './categoria.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de categorías requieren estar autenticado
router.use(requireAuth);

router.get('/', asyncHandler(categoriaController.listar));
router.get('/:id', asyncHandler(categoriaController.obtenerPorId));

// Solo ADMIN puede crear, editar o eliminar categorías
router.post('/', requireRole('ADMIN'), asyncHandler(categoriaController.crear));
router.put('/:id', requireRole('ADMIN'), asyncHandler(categoriaController.actualizar));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(categoriaController.eliminar));

export default router;
