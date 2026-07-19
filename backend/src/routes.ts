import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import productoRoutes from './modules/productos/producto.routes';
import ventaRoutes from './modules/ventas/venta.routes';
import categoriaRoutes from './modules/categorias/categoria.routes';
import clienteRoutes from './modules/clientes/cliente.routes';
import proveedorRoutes from './modules/proveedores/proveedor.routes';
import compraRoutes from './modules/compras/compra.routes';
import inventarioRoutes from './modules/inventario/inventario.routes';
import turnoCajaRoutes from './modules/turnos-caja/turno-caja.routes';
import reporteRoutes from './modules/reportes/reporte.routes';
// A medida que implementes los demás módulos (categorias, clientes, compras,
// proveedores, inventario, turnos-caja, reportes), impórtalos aquí siguiendo
// el mismo patrón que productos y ventas.

const router = Router();

router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/ventas', ventaRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/clientes', clienteRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/compras', compraRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/turnos-caja', turnoCajaRoutes);
router.use('/reportes', reporteRoutes);

export default router;
