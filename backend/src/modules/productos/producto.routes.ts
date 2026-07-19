import { Router } from 'express';
import { productoController } from './producto.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de productos requieren estar autenticado
router.use(requireAuth);

router.get('/', asyncHandler(productoController.listar));
router.get('/stock-bajo', asyncHandler(productoController.listarStockBajo));
router.get('/codigo-barras/:codigo', asyncHandler(productoController.buscarPorCodigoBarras));
router.get('/:id', asyncHandler(productoController.obtenerPorId));

// Solo ADMIN puede crear, editar o eliminar productos
router.post('/', requireRole('ADMIN'), asyncHandler(productoController.crear));
router.put('/:id', requireRole('ADMIN'), asyncHandler(productoController.actualizar));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(productoController.eliminar));

export default router;
