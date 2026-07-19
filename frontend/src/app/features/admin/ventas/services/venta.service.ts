import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Venta, PaginatedVentas } from '../../../../core/models/venta.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly baseUrl = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) { }

  listar(filtros?: { desde?: string; hasta?: string; limite?: number; pagina?: number }): Observable<PaginatedVentas> {
    let params = new HttpParams();
    if (filtros?.desde) {
      params = params.set('desde', filtros.desde);
    }
    if (filtros?.hasta) {
      params = params.set('hasta', filtros.hasta);
    }
    if (filtros?.limite) {
      params = params.set('limite', filtros.limite.toString());
    }
    if (filtros?.pagina) {
      params = params.set('pagina', filtros.pagina.toString());
    }

    return this.http
      .get<ApiResponse<PaginatedVentas>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Venta> {
    return this.http
      .get<ApiResponse<Venta>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  anular(id: string): Observable<Venta> {
    return this.http
      .post<ApiResponse<Venta>>(`${this.baseUrl}/${id}/anular`, {})
      .pipe(map((res) => res.data));
  }
}
