import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MovimientoInventario, CrearAjusteDto, FiltrarMovimientosDto, PaginatedMovimientos } from '../../../../core/models/inventario.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly baseUrl = `${environment.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  listar(filtros: FiltrarMovimientosDto = {}): Observable<PaginatedMovimientos> {
    let params = new HttpParams();

    if (filtros.productoId) {
      params = params.set('productoId', filtros.productoId);
    }
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (filtros.limite) {
      params = params.set('limite', filtros.limite.toString());
    }
    if (filtros.pagina) {
      params = params.set('pagina', filtros.pagina.toString());
    }

    return this.http
      .get<ApiResponse<PaginatedMovimientos>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  crearAjuste(data: CrearAjusteDto): Observable<MovimientoInventario> {
    return this.http
      .post<ApiResponse<MovimientoInventario>>(`${this.baseUrl}/ajustes`, data)
      .pipe(map((res) => res.data));
  }
}
