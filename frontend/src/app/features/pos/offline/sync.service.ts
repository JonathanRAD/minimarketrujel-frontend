import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocalDbService } from './local-db.service';

/**
 * Revisa periódicamente si hay ventas pendientes en IndexedDB y las reenvía
 * al backend cuando detecta conexión. Usa el mismo UUID generado en el cliente
 * para que el backend sea idempotente (no duplique ventas si se reenvía).
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly baseUrl = `${environment.apiUrl}/ventas`;
  private sincronizando = false;

  constructor(
    private http: HttpClient,
    private localDb: LocalDbService,
  ) {
    window.addEventListener('online', () => this.sincronizarPendientes());
    // Reintenta cada 30s por si el evento 'online' no dispara en algún dispositivo
    setInterval(() => this.sincronizarPendientes(), 30_000);
  }

  async sincronizarPendientes(): Promise<void> {
    if (this.sincronizando || !navigator.onLine) return;
    this.sincronizando = true;

    try {
      const pendientes = await this.localDb.obtenerPendientes();
      for (const venta of pendientes) {
        try {
          await firstValueFrom(this.http.post(this.baseUrl, venta.payload));
          await this.localDb.marcarSincronizada(venta.id);
        } catch (err: any) {
          if (err.status >= 400 && err.status < 500) {
            // El servidor procesó y rechazó definitivamente (ej. 422 stock insuficiente)
            await this.localDb.eliminarVentaPendiente(venta.id);
          } else {
            // Fallo de red temporal o error de servidor (500), reintentar después
            await this.localDb.incrementarIntento(venta.id);
          }
        }
      }
    } finally {
      this.sincronizando = false;
    }
  }
}
