import { Routes } from '@angular/router';

export const PROMOCIONES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/promociones-list/promociones-list.page').then(
        (m) => m.PromocionesListPageComponent,
      ),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/promocion-form/promocion-form.page').then(
        (m) => m.PromocionFormPageComponent,
      ),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/promocion-form/promocion-form.page').then(
        (m) => m.PromocionFormPageComponent,
      ),
  },
];
