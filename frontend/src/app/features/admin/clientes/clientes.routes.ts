import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clientes-list/clientes-list.page').then((m) => m.ClientesListPageComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/cliente-form/cliente-form.page').then((m) => m.ClienteFormPageComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/cliente-form/cliente-form.page').then((m) => m.ClienteFormPageComponent),
  },
  {
    path: ':id/detalle',
    loadComponent: () =>
      import('./pages/cliente-detail/cliente-detail.page').then((m) => m.ClienteDetailPageComponent),
  },
];
