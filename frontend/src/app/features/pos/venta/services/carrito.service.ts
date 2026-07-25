import { Injectable, computed, signal } from '@angular/core';
import { ItemCarrito } from '../../../../core/models/venta.model';
import { Producto } from '../../../../core/models/producto.model';
import { Promocion } from '../../../../core/models/promocion.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _items = signal<ItemCarrito[]>([]);
  readonly items = this._items.asReadonly();

  private readonly _promociones = signal<Promocion[]>([]);
  readonly promociones = this._promociones.asReadonly();

  readonly total = computed(() =>
    this._items().reduce((acc, item) => acc + item.subtotal, 0),
  );

  readonly ahorroTotal = computed(() =>
    this._items().reduce((acc, item) => acc + item.ahorro, 0),
  );

  readonly cantidadTotal = computed(() =>
    this._items().reduce((acc, item) => acc + item.cantidad, 0),
  );

  cargarPromociones(promos: Promocion[]): void {
    this._promociones.set(promos);
    this.recalcularTodo();
  }

  agregarProducto(producto: Producto, cantidad: number = 1): void {
    const items = this._items();
    const existente = items.find((i) => i.producto.id === producto.id);

    if (existente) {
      this.actualizarCantidad(producto.id, Number((existente.cantidad + cantidad).toFixed(3)));
      return;
    }

    const itemBase: ItemCarrito = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        codigoBarras: producto.codigoBarras,
        precioVenta: Number(producto.precioVenta),
        unidadMedida: producto.unidadMedida,
        categoriaId: producto.categoriaId,
      },
      cantidad,
      precioOriginal: Number(producto.precioVenta),
      precioUnitario: Number(producto.precioVenta),
      subtotal: Number((cantidad * Number(producto.precioVenta)).toFixed(2)),
      ahorro: 0,
    };

    const itemCalculado = this.calcularOfertaItem(itemBase);
    this._items.set([...items, itemCalculado]);
  }

  actualizarCantidad(productoId: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.quitarProducto(productoId);
      return;
    }
    this._items.set(
      this._items().map((item) => {
        if (item.producto.id === productoId) {
          const modificado = { ...item, cantidad };
          return this.calcularOfertaItem(modificado);
        }
        return item;
      }),
    );
  }

  quitarProducto(productoId: string): void {
    this._items.set(this._items().filter((i) => i.producto.id !== productoId));
  }

  limpiar(): void {
    this._items.set([]);
  }

  private recalcularTodo(): void {
    this._items.set(this._items().map((item) => this.calcularOfertaItem(item)));
  }

  private calcularOfertaItem(item: ItemCarrito): ItemCarrito {
    const promos = this._promociones();
    const precioBase = item.precioOriginal;
    const cant = item.cantidad;

    if (!promos || promos.length === 0) {
      return {
        ...item,
        precioUnitario: precioBase,
        precioEspecial: undefined,
        promocionTitulo: undefined,
        subtotal: Number((cant * precioBase).toFixed(2)),
        ahorro: 0,
      };
    }

    // Buscar la promoción más específica (por productoId primero, luego por categoriaId)
    const promo = promos.find(
      (p) => p.productoId === item.producto.id || (p.categoriaId && p.categoriaId === item.producto.categoriaId)
    );

    if (!promo) {
      return {
        ...item,
        precioUnitario: precioBase,
        precioEspecial: undefined,
        promocionTitulo: undefined,
        subtotal: Number((cant * precioBase).toFixed(2)),
        ahorro: 0,
      };
    }

    let precioFinalUnitario = precioBase;
    let subtotalFinal = cant * precioBase;
    let ahorroFinal = 0;

    switch (promo.tipo) {
      case 'PORCENTAJE': {
        const pct = Number(promo.valorDescuento || 0);
        precioFinalUnitario = Number((precioBase * (1 - pct / 100)).toFixed(2));
        subtotalFinal = Number((cant * precioFinalUnitario).toFixed(2));
        ahorroFinal = Number(((precioBase - precioFinalUnitario) * cant).toFixed(2));
        break;
      }
      case 'PRECIO_FIJO': {
        precioFinalUnitario = Number(promo.valorDescuento || precioBase);
        subtotalFinal = Number((cant * precioFinalUnitario).toFixed(2));
        ahorroFinal = Number(((precioBase - precioFinalUnitario) * cant).toFixed(2));
        break;
      }
      case 'VOLUMEN': {
        if (cant >= promo.cantidadMinima) {
          precioFinalUnitario = Number(promo.valorDescuento || precioBase);
          subtotalFinal = Number((cant * precioFinalUnitario).toFixed(2));
          ahorroFinal = Number(((precioBase - precioFinalUnitario) * cant).toFixed(2));
        } else {
          subtotalFinal = Number((cant * precioBase).toFixed(2));
        }
        break;
      }
      case 'PROMO_NXM': {
        if (cant >= promo.cantidadMinima && promo.cantidadGratis) {
          const bloques = Math.floor(cant / promo.cantidadMinima);
          const unidadesGratis = bloques * promo.cantidadGratis;
          const unidadesCobradas = Math.max(0, cant - unidadesGratis);
          subtotalFinal = Number((unidadesCobradas * precioBase).toFixed(2));
          ahorroFinal = Number((unidadesGratis * precioBase).toFixed(2));
        } else {
          subtotalFinal = Number((cant * precioBase).toFixed(2));
        }
        break;
      }
    }

    return {
      ...item,
      precioUnitario: precioFinalUnitario,
      precioEspecial: precioFinalUnitario < precioBase ? precioFinalUnitario : undefined,
      promocionTitulo: promo.titulo,
      subtotal: Math.max(0, subtotalFinal),
      ahorro: Math.max(0, ahorroFinal),
    };
  }
}
