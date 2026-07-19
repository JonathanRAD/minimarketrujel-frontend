import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../../../../core/models/producto.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent } from '@shared/components';

@Component({
  selector: 'app-productos-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent],
  templateUrl: './productos-list.page.html',
  styleUrl: './productos-list.page.scss'
})
export class ProductosListPageComponent implements OnInit {
  private productoService = inject(ProductoService);

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);
  busqueda = signal('');

  // Paginación
  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.productoService.listar({
      busqueda: this.busqueda() || undefined,
      pagina: this.pagina(),
      limite: this.limite(),
    }).subscribe({
      next: (res) => {
        this.productos.set(res.productos);
        this.total.set(res.total);
        this.paginas.set(res.paginas);
        this.pagina.set(res.pagina);
        this.limite.set(res.limite);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar los productos');
      },
    });
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargar();
  }

  cambiarLimite(l: number) {
    this.limite.set(l);
    this.pagina.set(1);
    this.cargar();
  }

  eliminar(prod: Producto): void {
    if (!confirm(`¿Seguro que quieres desactivar "${prod.nombre}"?`)) return;
    this.productoService.eliminar(prod.id).subscribe(() => this.cargar());
  }

  esStockBajo(producto: Producto): boolean {
    return Number(producto.stockActual) <= Number(producto.stockMinimo);
  }
}
