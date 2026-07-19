import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/kardex/kardex.page').then((m) => m.KardexPageComponent),
  },
  {
    path: 'ajuste',
    loadComponent: () =>
      import('./pages/ajuste-form/ajuste-form.page').then((m) => m.AjusteFormPageComponent),
  },
];
