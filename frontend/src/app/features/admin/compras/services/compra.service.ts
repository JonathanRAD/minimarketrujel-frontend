import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Compra, CrearCompraDto, EstadoCompra, PaginatedCompras } from '../../../../core/models/compra.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly baseUrl = `${environment.apiUrl}/compras`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { proveedorId?: string; desde?: string; hasta?: string; limite?: number; pagina?: number }): Observable<PaginatedCompras> {
    const params: any = {};
    if (filtros?.proveedorId) params.proveedorId = filtros.proveedorId;
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;
    if (filtros?.limite) params.limite = filtros.limite.toString();
    if (filtros?.pagina) params.pagina = filtros.pagina.toString();

    return this.http
      .get<ApiResponse<PaginatedCompras>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Compra> {
    return this.http
      .get<ApiResponse<Compra>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(data: CrearCompraDto): Observable<Compra> {
    return this.http
      .post<ApiResponse<Compra>>(this.baseUrl, data)
      .pipe(map((res) => res.data));
  }

  actualizarEstado(id: string, estado: EstadoCompra): Observable<Compra> {
    return this.http
      .put<ApiResponse<Compra>>(`${this.baseUrl}/${id}/estado`, { estado })
      .pipe(map((res) => res.data));
  }
}
