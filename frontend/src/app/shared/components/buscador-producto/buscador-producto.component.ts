import { Component, EventEmitter, Input, Output, inject, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../../features/admin/productos/services/producto.service';
import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-buscador-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscador-producto.component.html',
  styleUrl: './buscador-producto.component.scss',
})
export class BuscadorProductoComponent {
  private productoService = inject(ProductoService);
  private eRef = inject(ElementRef);

  @Input() placeholder = 'Buscar producto por nombre o código...';
  @Input() label = 'Buscador de Productos';
  @Input() selectedProducto: Producto | null = null;
  @Input() clearOnSelect = false;

  @Output() productoSeleccionado = new EventEmitter<Producto>();
  @Output() productoDeseleccionado = new EventEmitter<void>();

  textoBusqueda = signal('');
  productosEncontrados = signal<Producto[]>([]);
  buscando = signal(false);

  // Escuchar clics fuera del componente para cerrar los resultados
  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.productosEncontrados.set([]);
    }
  }

  buscar(valor: string) {
    this.textoBusqueda.set(valor);
    if (!valor || valor.trim().length < 2) {
      this.productosEncontrados.set([]);
      return;
    }

    this.buscando.set(true);
    this.productoService.listar({ busqueda: valor.trim(), limite: 5 }).subscribe({
      next: (res) => {
        this.productosEncontrados.set(res.productos);
        this.buscando.set(false);
      },
      error: () => {
        this.productosEncontrados.set([]);
        this.buscando.set(false);
      }
    });
  }

  seleccionar(producto: Producto) {
    this.productoSeleccionado.emit(producto);
    this.productosEncontrados.set([]);
    
    if (this.clearOnSelect) {
      this.textoBusqueda.set('');
    } else {
      this.textoBusqueda.set(producto.nombre);
    }
  }

  limpiar() {
    this.textoBusqueda.set('');
    this.productosEncontrados.set([]);
    this.productoDeseleccionado.emit();
  }

  esBajoStock(producto: Producto): boolean {
    return Number(producto.stockActual) <= Number(producto.stockMinimo);
  }
}
