import { Routes } from '@angular/router';

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/categorias-list/categorias-list.page').then((m) => m.CategoriasListPageComponent),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/categoria-form/categoria-form.page').then((m) => m.CategoriaFormPageComponent),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/categoria-form/categoria-form.page').then((m) => m.CategoriaFormPageComponent),
  },
];
