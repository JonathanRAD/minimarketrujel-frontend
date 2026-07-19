import { Routes } from '@angular/router';

export const POS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./venta/pages/venta/venta.page').then((m) => m.VentaPageComponent),
  },
];
