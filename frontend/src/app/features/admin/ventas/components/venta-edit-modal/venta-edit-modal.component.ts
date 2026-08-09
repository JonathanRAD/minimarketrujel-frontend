import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { VentaService } from '../../services/venta.service';
import { ProductoService } from '../../../productos/services/producto.service';
import { Venta, MetodoPago } from '../../../../../core/models/venta.model';
import { Producto } from '../../../../../core/models/producto.model';
import { ErrorAlertComponent, SpinnerComponent } from '@shared/components';

export interface ItemEdicionVenta {
  productoId: string;
  nombre: string;
  codigoBarras?: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  stockActual: number;
  unidadMedida: string;
}

@Component({
  selector: 'app-venta-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ErrorAlertComponent,
    SpinnerComponent,
  ],
  templateUrl: './venta-edit-modal.component.html',
  styleUrl: './venta-edit-modal.component.scss',
})
export class VentaEditModalComponent implements OnInit {
  private ventaService = inject(VentaService);
  private productoService = inject(ProductoService);
  public dialogRef = inject(MatDialogRef<VentaEditModalComponent>);
  public data: { venta: Venta } = inject(MAT_DIALOG_DATA);

  items = signal<ItemEdicionVenta[]>([]);
  metodoPago = signal<MetodoPago>('EFECTIVO');
  montoEfectivo = signal<number>(0);
  montoTarjeta = signal<number>(0);

  busquedaProducto = signal<string>('');
  buscandoProductos = signal<boolean>(false);
  resultadosBusqueda = signal<Producto[]>([]);

  guardando = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const v = this.data.venta;
    this.metodoPago.set(v.metodoPago);
    this.montoEfectivo.set(Number(v.montoEfectivo || 0));
    this.montoTarjeta.set(Number(v.montoTarjeta || 0));

    if (v.detalles) {
      const itemsIniciales: ItemEdicionVenta[] = v.detalles.map((d) => ({
        productoId: d.productoId,
        nombre: d.producto?.nombre || 'Producto',
        codigoBarras: d.producto?.codigoBarras,
        precioUnitario: Number(d.precioUnitario),
        cantidad: Number(d.cantidad),
        subtotal: Number(d.subtotal),
        stockActual: Number(d.producto?.stockActual || 0),
        unidadMedida: d.producto?.unidadMedida || 'UND',
      }));
      this.items.set(itemsIniciales);
    }
  }

  get totalCalculado(): number {
    return this.items().reduce((sum, item) => sum + item.subtotal, 0);
  }

  buscarProductos(): void {
    const q = this.busquedaProducto().trim();
    if (!q) {
      this.resultadosBusqueda.set([]);
      return;
    }

    this.buscandoProductos.set(true);
    this.productoService.listar({ busqueda: q, limite: 8 }).subscribe({
      next: (res) => {
        this.buscandoProductos.set(false);
        this.resultadosBusqueda.set(res.productos || []);
      },
      error: () => {
        this.buscandoProductos.set(false);
      },
    });
  }

  agregarProducto(prod: Producto): void {
    const existente = this.items().find((i) => i.productoId === prod.id);

    if (existente) {
      this.actualizarCantidad(existente, existente.cantidad + 1);
    } else {
      const pUnit = Number(prod.precioVenta);
      const nuevoItem: ItemEdicionVenta = {
        productoId: prod.id,
        nombre: prod.nombre,
        codigoBarras: prod.codigoBarras,
        precioUnitario: pUnit,
        cantidad: 1,
        subtotal: pUnit,
        stockActual: Number(prod.stockActual),
        unidadMedida: prod.unidadMedida,
      };
      this.items.update((list) => [...list, nuevoItem]);
    }

    this.busquedaProducto.set('');
    this.resultadosBusqueda.set([]);
  }

  actualizarCantidad(item: ItemEdicionVenta, nuevaCant: number): void {
    if (nuevaCant <= 0) {
      this.eliminarItem(item);
      return;
    }

    this.items.update((list) =>
      list.map((i) => {
        if (i.productoId === item.productoId) {
          const sub = Number((nuevaCant * i.precioUnitario).toFixed(2));
          return { ...i, cantidad: nuevaCant, subtotal: sub };
        }
        return i;
      })
    );
  }

  eliminarItem(item: ItemEdicionVenta): void {
    this.items.update((list) => list.filter((i) => i.productoId !== item.productoId));
  }

  guardarCambios(): void {
    if (this.items().length === 0) {
      this.error.set('La venta debe tener al menos un producto.');
      return;
    }

    const total = this.totalCalculado;
    let mEfectivo = 0;
    let mTarjeta = 0;

    if (this.metodoPago() === 'MIXTO') {
      mEfectivo = Number(this.montoEfectivo());
      mTarjeta = Number(this.montoTarjeta());
      if (Math.abs(mEfectivo + mTarjeta - total) > 0.01) {
        this.error.set(
          `La suma de efectivo (S/ ${mEfectivo.toFixed(2)}) y tarjeta (S/ ${mTarjeta.toFixed(2)}) debe ser igual al total (S/ ${total.toFixed(2)})`
        );
        return;
      }
    } else if (this.metodoPago() === 'EFECTIVO') {
      mEfectivo = total;
    } else if (this.metodoPago() === 'TARJETA') {
      mTarjeta = total;
    }

    this.guardando.set(true);
    this.error.set(null);

    const payload = {
      clienteId: this.data.venta.clienteId,
      metodoPago: this.metodoPago(),
      montoEfectivo: mEfectivo,
      montoTarjeta: mTarjeta,
      detalles: this.items().map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    };

    this.ventaService.actualizar(this.data.venta.id, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.message || 'Error al guardar los cambios de la venta.');
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
