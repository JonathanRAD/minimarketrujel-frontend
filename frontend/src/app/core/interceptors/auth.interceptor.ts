import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Interceptor funcional (Angular 15+): agrega el Bearer token a cada request */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  if (!token) {
    return next(req);
  }

  const clonado = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(clonado);
};
