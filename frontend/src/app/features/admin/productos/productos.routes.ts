import { Routes } from '@angular/router';

export const PRODUCTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/productos-list/productos-list.page').then((m) => m.ProductosListPageComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/producto-form/producto-form.page').then((m) => m.ProductoFormPageComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/producto-form/producto-form.page').then((m) => m.ProductoFormPageComponent),
  },
];
