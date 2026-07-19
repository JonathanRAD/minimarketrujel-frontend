import { Routes } from '@angular/router';

export const TURNOS_CAJA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/turnos-caja-list/turnos-caja-list.page').then((m) => m.TurnosCajaListPageComponent),
  },
  {
    path: 'control',
    loadComponent: () =>
      import('./pages/turno-caja-control/turno-caja-control.page').then((m) => m.TurnoCajaControlPageComponent),
  },
];
