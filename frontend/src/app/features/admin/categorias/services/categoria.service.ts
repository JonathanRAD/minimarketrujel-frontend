import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Categoria, CrearCategoriaDto, ActualizarCategoriaDto } from '../../../../core/models/categoria.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Categoria[]> {
    return this.http
      .get<ApiResponse<Categoria[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Categoria> {
    return this.http
      .get<ApiResponse<Categoria>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(data: CrearCategoriaDto): Observable<Categoria> {
    return this.http
      .post<ApiResponse<Categoria>>(this.baseUrl, data)
      .pipe(map((res) => res.data));
  }

  actualizar(id: string, data: ActualizarCategoriaDto): Observable<Categoria> {
    return this.http
      .put<ApiResponse<Categoria>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
