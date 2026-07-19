import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPageComponent),
  },
];
