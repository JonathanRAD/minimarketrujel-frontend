import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  Producto,
  CrearProductoDto,
  ActualizarProductoDto,
  PaginatedProductos,
} from '../../../../core/models/producto.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { categoriaId?: string; busqueda?: string; limite?: number; pagina?: number; todo?: boolean }): Observable<PaginatedProductos> {
    const params: any = {};
    if (filtros?.categoriaId) params.categoriaId = filtros.categoriaId;
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;
    if (filtros?.limite) params.limite = filtros.limite.toString();
    if (filtros?.pagina) params.pagina = filtros.pagina.toString();
    if (filtros?.todo) params.todo = 'true';

    return this.http
      .get<ApiResponse<PaginatedProductos>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  obtenerPorId(id: string): Observable<Producto> {
    return this.http
      .get<ApiResponse<Producto>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  /** Usado por la pantalla POS al escanear un código de barras */
  buscarPorCodigoBarras(codigo: string): Observable<Producto> {
    return this.http
      .get<ApiResponse<Producto>>(`${this.baseUrl}/codigo-barras/${codigo}`)
      .pipe(map((res) => res.data));
  }

  crear(data: CrearProductoDto): Observable<Producto> {
    return this.http
      .post<ApiResponse<Producto>>(this.baseUrl, data)
      .pipe(map((res) => res.data));
  }

  actualizar(id: string, data: ActualizarProductoDto): Observable<Producto> {
    return this.http
      .put<ApiResponse<Producto>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarStockBajo(): Observable<Producto[]> {
    return this.http
      .get<ApiResponse<Producto[]>>(`${this.baseUrl}/stock-bajo`)
      .pipe(map((res) => res.data));
  }
}
