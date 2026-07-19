import { Routes } from '@angular/router';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/proveedores-list/proveedores-list.page').then((m) => m.ProveedoresListPageComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/proveedor-form/proveedor-form.page').then((m) => m.ProveedorFormPageComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/proveedor-form/proveedor-form.page').then((m) => m.ProveedorFormPageComponent),
  },
];
