import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Cliente, CrearClienteDto, ActualizarClienteDto, Fiado, PaginatedClientes } from '../../../../core/models/cliente.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly baseUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { busqueda?: string; limite?: number; pagina?: number; todo?: boolean }): Observable<PaginatedClientes> {
    const params: any = {};
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;
    if (filtros?.limite) params.limite = filtros.limite.toString();
    if (filtros?.pagina) params.pagina = filtros.pagina.toString();
    if (filtros?.todo) params.todo = 'true';

    return this.http
      .get<ApiResponse<PaginatedClientes>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Cliente> {
    return this.http
      .get<ApiResponse<Cliente>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(data: CrearClienteDto): Observable<Cliente> {
    return this.http
      .post<ApiResponse<Cliente>>(this.baseUrl, data)
      .pipe(map((res) => res.data));
  }

  actualizar(id: string, data: ActualizarClienteDto): Observable<Cliente> {
    return this.http
      .put<ApiResponse<Cliente>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // --- SERVICIOS DE FIADOS ---

  listarFiados(clienteId: string): Observable<Fiado[]> {
    return this.http
      .get<ApiResponse<Fiado[]>>(`${this.baseUrl}/${clienteId}/fiados`)
      .pipe(map((res) => res.data));
  }

  pagarFiado(fiadoId: string): Observable<Fiado> {
    return this.http
      .post<ApiResponse<Fiado>>(`${this.baseUrl}/fiados/${fiadoId}/pagar`, {})
      .pipe(map((res) => res.data));
  }
}
