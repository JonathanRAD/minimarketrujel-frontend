import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'productos',
    loadChildren: () =>
      import('./productos/productos.routes').then((m) => m.PRODUCTOS_ROUTES),
  },
  {
    path: 'categorias',
    loadChildren: () =>
      import('./categorias/categorias.routes').then((m) => m.CATEGORIAS_ROUTES),
  },
  {
    path: 'clientes',
    loadChildren: () =>
      import('./clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
  },
  {
    path: 'proveedores',
    loadChildren: () =>
      import('./proveedores/proveedores.routes').then((m) => m.PROVEEDORES_ROUTES),
  },
  {
    path: 'compras',
    loadChildren: () =>
      import('./compras/compras.routes').then((m) => m.COMPRAS_ROUTES),
  },
  {
    path: 'inventario',
    loadChildren: () =>
      import('./inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
  },
  {
    path: 'turnos-caja',
    loadChildren: () =>
      import('./turnos-caja/turnos-caja.routes').then((m) => m.TURNOS_CAJA_ROUTES),
  },
  {
    path: 'reportes',
    loadChildren: () =>
      import('./reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
  },
  {
    path: 'ventas',
    loadChildren: () =>
      import('./ventas/ventas.routes').then((m) => m.VENTAS_ROUTES),
  },
  // A medida que construyas los demás submódulos (categorias, ventas,
  // inventario, clientes, proveedores, compras, reportes, turnos-caja),
  // agrégalos aquí siguiendo el mismo patrón que "productos".
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
];
