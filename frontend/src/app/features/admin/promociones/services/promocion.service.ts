import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  Promocion,
  CrearPromocionDto,
  ActualizarPromocionDto,
  PaginatedPromociones,
} from '../../../../core/models/promocion.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class PromocionService {
  private readonly baseUrl = `${environment.apiUrl}/promociones`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { busqueda?: string; activo?: boolean; limite?: number; pagina?: number; ordenarPor?: string }): Observable<PaginatedPromociones> {
    let params = new HttpParams();
    if (filtros?.busqueda) params = params.set('busqueda', filtros.busqueda);
    if (filtros?.activo !== undefined) params = params.set('activo', filtros.activo.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());
    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.ordenarPor) params = params.set('ordenarPor', filtros.ordenarPor);

    return this.http
      .get<ApiResponse<PaginatedPromociones>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  obtenerVigentes(): Observable<Promocion[]> {
    return this.http
      .get<ApiResponse<Promocion[]>>(`${this.baseUrl}/vigentes`)
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Promocion> {
    return this.http
      .get<ApiResponse<Promocion>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(data: CrearPromocionDto): Observable<Promocion> {
    return this.http
      .post<ApiResponse<Promocion>>(this.baseUrl, data)
      .pipe(map((res) => res.data));
  }

  actualizar(id: string, data: ActualizarPromocionDto): Observable<Promocion> {
    return this.http
      .put<ApiResponse<Promocion>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  cambiarEstado(id: string, activo: boolean): Observable<Promocion> {
    return this.http
      .patch<ApiResponse<Promocion>>(`${this.baseUrl}/${id}/estado`, { activo })
      .pipe(map((res) => res.data));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
