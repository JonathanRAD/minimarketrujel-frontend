export type RolUsuario = 'ADMIN' | 'CAJERO';

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioAutenticado;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginPinDto {
  pin: string;
}
