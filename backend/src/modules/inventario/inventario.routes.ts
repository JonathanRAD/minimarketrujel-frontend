import { Router } from 'express';
import { inventarioController } from './inventario.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de inventario requieren estar autenticado
router.use(requireAuth);

router.get('/', asyncHandler(inventarioController.listar));

// Solo ADMIN puede registrar ajustes manuales de stock
router.post('/ajustes', requireRole('ADMIN'), asyncHandler(inventarioController.crearAjuste));

export default router;
