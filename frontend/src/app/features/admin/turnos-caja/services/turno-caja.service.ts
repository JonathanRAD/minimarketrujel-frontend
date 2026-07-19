import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TurnoCaja, AperturaTurnoDto, CierreTurnoDto, PaginatedTurnos } from '../../../../core/models/turno-caja.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class TurnoCajaService {
  private readonly baseUrl = `${environment.apiUrl}/turnos-caja`;

  constructor(private http: HttpClient) {}

  obtenerActivo(): Observable<TurnoCaja | null> {
    return this.http
      .get<ApiResponse<TurnoCaja | null>>(`${this.baseUrl}/activo`)
      .pipe(map((res) => res.data));
  }

  abrirCaja(data: AperturaTurnoDto): Observable<TurnoCaja> {
    return this.http
      .post<ApiResponse<TurnoCaja>>(`${this.baseUrl}/apertura`, data)
      .pipe(map((res) => res.data));
  }

  cerrarCaja(data: CierreTurnoDto): Observable<TurnoCaja> {
    return this.http
      .post<ApiResponse<TurnoCaja>>(`${this.baseUrl}/cierre`, data)
      .pipe(map((res) => res.data));
  }

  listar(filtros?: { desde?: string; hasta?: string; limite?: number; pagina?: number }): Observable<PaginatedTurnos> {
    const params: any = {};
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;
    if (filtros?.limite) params.limite = filtros.limite.toString();
    if (filtros?.pagina) params.pagina = filtros.pagina.toString();

    return this.http
      .get<ApiResponse<PaginatedTurnos>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }
}
