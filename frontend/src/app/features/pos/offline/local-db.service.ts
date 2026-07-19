import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { CrearVentaDto } from '../../../core/models/venta.model';

export interface VentaPendiente {
  id: string; // UUID generado en el cliente
  payload: CrearVentaDto;
  sincronizado: number; // 0 = pendiente, 1 = sincronizado (Dexie no indexa booleans)
  fechaCreacion: string;
  intentos: number;
}

@Injectable({ providedIn: 'root' })
export class LocalDbService extends Dexie {
  ventasPendientes!: Table<VentaPendiente, string>;

  constructor() {
    super('MinimarketLocalDB');
    this.version(1).stores({
      ventasPendientes: 'id, sincronizado, fechaCreacion',
    });
  }

  async guardarVentaPendiente(venta: CrearVentaDto & { id: string }): Promise<void> {
    await this.ventasPendientes.put({
      id: venta.id,
      payload: venta,
      sincronizado: 0,
      fechaCreacion: new Date().toISOString(),
      intentos: 0,
    });
  }

  async obtenerPendientes(): Promise<VentaPendiente[]> {
    return this.ventasPendientes.where('sincronizado').equals(0).toArray();
  }

  async marcarSincronizada(id: string): Promise<void> {
    await this.ventasPendientes.update(id, { sincronizado: 1 });
  }

  async incrementarIntento(id: string): Promise<void> {
    const venta = await this.ventasPendientes.get(id);
    if (venta) {
      await this.ventasPendientes.update(id, { intentos: venta.intentos + 1 });
    }
  }

  async eliminarVentaPendiente(id: string): Promise<void> {
    await this.ventasPendientes.delete(id);
  }
}