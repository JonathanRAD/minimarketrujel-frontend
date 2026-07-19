import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'pos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/pos-layout/pos-layout.component').then((m) => m.PosLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/pos/pos.routes').then((m) => m.POS_ROUTES),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: '', redirectTo: 'pos', pathMatch: 'full' },
  { path: '**', redirectTo: 'pos' },
];
