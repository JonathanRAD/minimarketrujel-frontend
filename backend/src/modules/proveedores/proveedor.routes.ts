import { Router } from 'express';
import { proveedorController } from './proveedor.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de proveedores requieren estar autenticado
router.use(requireAuth);

router.get('/', asyncHandler(proveedorController.listar));
router.get('/:id', asyncHandler(proveedorController.obtenerPorId));

// Solo ADMIN puede crear, editar o eliminar proveedores
router.post('/', requireRole('ADMIN'), asyncHandler(proveedorController.crear));
router.put('/:id', requireRole('ADMIN'), asyncHandler(proveedorController.actualizar));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(proveedorController.eliminar));

export default router;
