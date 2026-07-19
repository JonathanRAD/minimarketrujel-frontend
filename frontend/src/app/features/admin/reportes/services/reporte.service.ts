import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DashboardReporte } from '../../../../core/models/reporte.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  obtenerDashboard(fechaInicio?: string, fechaFin?: string): Observable<DashboardReporte> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http
      .get<ApiResponse<DashboardReporte>>(`${this.baseUrl}/dashboard`, { params })
      .pipe(map((res) => res.data));
  }
}
