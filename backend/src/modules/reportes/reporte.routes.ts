import { Router } from 'express';
import { reporteController } from './reporte.controller';
import { asyncHandler } from '../../common/middlewares/errorHandler';
import { requireAuth, requireRole } from '../../common/middlewares/auth.middleware';

const router = Router();

// Todas las rutas de reportes requieren estar autenticado y ser ADMIN
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/dashboard', asyncHandler(reporteController.obtenerDashboard));

export default router;
