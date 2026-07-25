import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Categoria, CrearCategoriaDto, ActualizarCategoriaDto } from '../../../../core/models/categoria.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly baseUrl = `${environment.apiUrl}/categorias`;
  private categoriasCache$: Observable<Categoria[]> | null = null;

  constructor(private http: HttpClient) {}

  listar(filtros?: { busqueda?: string; ordenarPor?: string }): Observable<Categoria[]> {
    if (!filtros?.busqueda && (!filtros?.ordenarPor || filtros.ordenarPor === 'reciente')) {
      if (!this.categoriasCache$) {
        this.categoriasCache$ = this.http
          .get<ApiResponse<Categoria[]>>(this.baseUrl)
          .pipe(
            map((res) => res.data),
            shareReplay(1)
          );
      }
      return this.categoriasCache$;
    }

    const params: any = {};
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;
    if (filtros?.ordenarPor) params.ordenarPor = filtros.ordenarPor;

    return this.http
      .get<ApiResponse<Categoria[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Categoria> {
    return this.http
      .get<ApiResponse<Categoria>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  limpiarCache(): void {
    this.categoriasCache$ = null;
  }

  crear(data: CrearCategoriaDto): Observable<Categoria> {
    return this.http
      .post<ApiResponse<Categoria>>(this.baseUrl, data)
      .pipe(
        map((res) => res.data),
        tap(() => this.limpiarCache())
      );
  }

  actualizar(id: string, data: ActualizarCategoriaDto): Observable<Categoria> {
    return this.http
      .put<ApiResponse<Categoria>>(`${this.baseUrl}/${id}`, data)
      .pipe(
        map((res) => res.data),
        tap(() => this.limpiarCache())
      );
  }

  eliminar(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => res.data),
        tap(() => this.limpiarCache())
      );
  }
}
