import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Proveedor, CrearProveedorDto, ActualizarProveedorDto } from '../../../../core/models/proveedor.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly baseUrl = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Proveedor[]> {
    return this.http
      .get<ApiResponse<Proveedor[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Proveedor> {
    return this.http
      .get<ApiResponse<Proveedor>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(data: CrearProveedorDto): Observable<Proveedor> {
    return this.http
      .post<ApiResponse<Proveedor>>(this.baseUrl, data)
      .pipe(map((res) => res.data));
  }

  actualizar(id: string, data: ActualizarProveedorDto): Observable<Proveedor> {
    return this.http
      .put<ApiResponse<Proveedor>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
