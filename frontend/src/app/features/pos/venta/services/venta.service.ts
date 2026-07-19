import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CrearVentaDto, Venta } from '../../../../core/models/venta.model';
import { LocalDbService } from '../../offline/local-db.service';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly baseUrl = `${environment.apiUrl}/ventas`;

  constructor(
    private http: HttpClient,
    private localDb: LocalDbService,
  ) {}

  /**
   * Registra una venta. Genera el UUID en el cliente, guarda localmente primero
   * (local-first) y si hay internet la manda de inmediato al backend.
   * Si no hay internet, queda pendiente y el SyncService la reenvía después.
   */
  async registrarVenta(data: CrearVentaDto): Promise<{ id: string; sincronizado: boolean }> {
    const id = data.id ?? crypto.randomUUID();
    const ventaConId = { ...data, id };

    await this.localDb.guardarVentaPendiente(ventaConId);

    if (navigator.onLine) {
      try {
        await firstValueFrom(this.http.post<{ data: Venta }>(this.baseUrl, ventaConId));
        await this.localDb.marcarSincronizada(id);
        return { id, sincronizado: true };
      } catch (err: any) {
        if (err.status >= 400 && err.status < 500) {
          // El servidor procesó y rechazó la venta (ej: stock insuficiente, validación)
          await this.localDb.eliminarVentaPendiente(id);
          const serverMessage = err.error?.message || 'Error al procesar la venta en el servidor';
          throw new Error(serverMessage);
        }
        
        // Si es un fallo de red o conectividad, se queda guardada localmente
        return { id, sincronizado: false };
      }
    }

    return { id, sincronizado: false };
  }
}
