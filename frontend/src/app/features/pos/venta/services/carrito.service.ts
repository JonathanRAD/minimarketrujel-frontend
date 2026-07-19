import { Injectable, computed, signal } from '@angular/core';
import { ItemCarrito } from '../../../../core/models/venta.model';
import { Producto } from '../../../../core/models/producto.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _items = signal<ItemCarrito[]>([]);
  readonly items = this._items.asReadonly();

  readonly total = computed(() =>
    this._items().reduce((acc, item) => acc + item.subtotal, 0),
  );

  readonly cantidadTotal = computed(() =>
    this._items().reduce((acc, item) => acc + item.cantidad, 0),
  );

  agregarProducto(producto: Producto, cantidad: number = 1): void {
    const items = this._items();
    const existente = items.find((i) => i.producto.id === producto.id);

    if (existente) {
      this.actualizarCantidad(producto.id, Number((existente.cantidad + cantidad).toFixed(3)));
      return;
    }

    this._items.set([
      ...items,
      {
        producto: {
          id: producto.id,
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras,
          precioVenta: Number(producto.precioVenta),
          unidadMedida: producto.unidadMedida,
        },
        cantidad,
        subtotal: Number((cantidad * Number(producto.precioVenta)).toFixed(2)),
      },
    ]);
  }

  actualizarCantidad(productoId: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.quitarProducto(productoId);
      return;
    }
    this._items.set(
      this._items().map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad, subtotal: Number((cantidad * Number(item.producto.precioVenta)).toFixed(2)) }
          : item,
      ),
    );
  }

  quitarProducto(productoId: string): void {
    this._items.set(this._items().filter((i) => i.producto.id !== productoId));
  }

  limpiar(): void {
    this._items.set([]);
  }
}
