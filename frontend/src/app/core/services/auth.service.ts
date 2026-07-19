import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginDto, LoginPinDto, UsuarioAutenticado } from '../models/auth.model';

const TOKEN_KEY = 'minimarket_token';
const USUARIO_KEY = 'minimarket_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _usuario = signal<UsuarioAutenticado | null>(this.leerUsuarioGuardado());
  readonly usuario = this._usuario.asReadonly();
  readonly estaAutenticado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.rol === 'ADMIN');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { }

  login(data: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<{ success: boolean; data: AuthResponse }>(`${this.baseUrl}/login`, data)
      .pipe(
        map((res) => res.data),
        tap((auth) => this.guardarSesion(auth)),
      );
  }

  loginConPin(data: LoginPinDto): Observable<AuthResponse> {
    return this.http
      .post<{ success: boolean; data: AuthResponse }>(`${this.baseUrl}/login-pin`, data)
      .pipe(
        map((res) => res.data),
        tap((auth) => this.guardarSesion(auth)),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    this._usuario.set(null);
    this.router.navigate(['/auth/login']);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private guardarSesion(data: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(data.usuario));
    this._usuario.set(data.usuario);
  }

  private leerUsuarioGuardado(): UsuarioAutenticado | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    return raw ? (JSON.parse(raw) as UsuarioAutenticado) : null;
  }
}