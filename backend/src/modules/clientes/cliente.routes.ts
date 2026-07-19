import { Router } from 'express';
import { clienteController } from './cliente.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(requireAuth);

router.get('/', asyncHandler(clienteController.listar));
router.get('/:id', asyncHandler(clienteController.obtenerPorId));

// Crear, editar o eliminar clientes (tanto ADMIN como CAJERO pueden gestionarlos en el POS)
router.post('/', asyncHandler(clienteController.crear));
router.put('/:id', asyncHandler(clienteController.actualizar));
router.delete('/:id', asyncHandler(clienteController.eliminar));

// Endpoints de fiados/créditos
router.get('/:id/fiados', asyncHandler(clienteController.listarFiadosPendientes));
router.post('/fiados/:fiadoId/pagar', asyncHandler(clienteController.pagarFiado));

export default router;
