import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Producto } from '../../../../../core/models/producto.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent, ConfirmModalService, TableFilterComponent, SortOption } from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductoFormPageComponent } from '../producto-form/producto-form.page';

@Component({
  selector: 'app-productos-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent, TableFilterComponent, MatDialogModule],
  templateUrl: './productos-list.page.html',
  styleUrl: './productos-list.page.scss'
})
export class ProductosListPageComponent implements OnInit {
  private productoService = inject(ProductoService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);
  busqueda = signal('');
  ordenarPor = signal('reciente');

  sortOptions: SortOption[] = [
    { label: 'Más reciente', value: 'reciente', icon: 'schedule' },
    { label: 'Mayor stock', value: 'stock_desc', icon: 'inventory' },
    { label: 'Menor stock', value: 'stock_asc', icon: 'production_quantity_limits' },
    { label: 'Más caro', value: 'precio_desc', icon: 'arrow_upward' },
    { label: 'Más barato', value: 'precio_asc', icon: 'arrow_downward' },
    { label: 'Nombre A-Z', value: 'nombre_asc', icon: 'sort_by_alpha' },
  ];

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
      ordenarPor: this.ordenarPor(),
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
        this.errorMessage.set(err.error?.message || 'Error al cargar la lista de productos');
      }
    });
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  cambiarOrden(orden: string): void {
    this.ordenarPor.set(orden);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargar();
  }

  abrirModalForm(productoId?: string) {
    const dialogRef = this.dialog.open(ProductoFormPageComponent, {
      width: '900px',
      maxWidth: '96vw',
      data: { productoId },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargar();
      }
    });
  }

  async toggleEstado(producto: Producto) {
    const nuevoEstado = !producto.activo;
    this.productoService.actualizar(producto.id, { activo: nuevoEstado }).subscribe({
      next: () => this.cargar(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al actualizar el estado del producto')
    });
  }

  cambiarLimite(limite: number): void {
    this.limite.set(limite);
    this.pagina.set(1);
    this.cargar();
  }

  exportarExcel(): void {
    this.excelService.descargarExcel('productos');
  }

  async eliminar(producto: Producto) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Eliminar Producto?',
      mensaje: `¿Estás seguro de eliminar el producto "${producto.nombre}"?`,
      submensaje: 'Esta acción no se puede deshacer.',
      icono: 'inventory_2',
      tipo: 'danger',
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.productoService.eliminar(producto.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar el producto')
    });
  }
}
