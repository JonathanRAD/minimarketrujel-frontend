import { Routes } from '@angular/router';

export const COMPRAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/compras-list/compras-list.page').then((m) => m.ComprasListPageComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/compra-form/compra-form.page').then((m) => m.CompraFormPageComponent),
  },
  {
    path: ':id/detalle',
    loadComponent: () =>
      import('./pages/compra-detail/compra-detail.page').then((m) => m.CompraDetailPageComponent),
  },
];
