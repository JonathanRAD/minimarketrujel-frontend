import { Routes } from '@angular/router';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ventas-list/ventas-list.page').then((m) => m.VentasListPageComponent),
  },
];
