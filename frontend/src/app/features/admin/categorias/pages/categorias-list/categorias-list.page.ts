import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Categoria } from '../../../../../core/models/categoria.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, ConfirmModalService, TableFilterComponent, SortOption } from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoriaFormPageComponent } from '../categoria-form/categoria-form.page';

@Component({
  selector: 'app-categorias-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, TableFilterComponent, MatDialogModule],
  templateUrl: './categorias-list.page.html',
  styleUrl: './categorias-list.page.scss'
})
export class CategoriasListPageComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);
  busqueda = signal('');
  ordenarPor = signal('reciente');

  sortOptions: SortOption[] = [
    { label: 'Más reciente', value: 'reciente', icon: 'schedule' },
    { label: 'Más antiguo', value: 'antiguo', icon: 'history' },
    { label: 'Nombre A-Z', value: 'nombre_asc', icon: 'sort_by_alpha' },
    { label: 'Nombre Z-A', value: 'nombre_desc', icon: 'sort_by_alpha' },
  ];

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.categoriaService.listar({
      busqueda: this.busqueda() || undefined,
      ordenarPor: this.ordenarPor(),
    }).subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar las categorías');
      }
    });
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
    this.cargarCategorias();
  }

  cambiarOrden(orden: string): void {
    this.ordenarPor.set(orden);
    this.cargarCategorias();
  }

  abrirModalForm(categoriaId?: string) {
    const dialogRef = this.dialog.open(CategoriaFormPageComponent, {
      width: '540px',
      maxWidth: '95vw',
      data: { categoriaId },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarCategorias();
      }
    });
  }

  toggleEstado(cat: Categoria): void {
    const nuevoEstado = !cat.activo;
    this.categoriaService.actualizar(cat.id, { activo: nuevoEstado }).subscribe({
      next: () => this.cargarCategorias(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al actualizar estado de la categoría'),
    });
  }

  exportarExcel(): void {
    this.excelService.descargarExcel('categorias');
  }

  async eliminar(cat: Categoria) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Eliminar Categoría?',
      mensaje: `¿Estás seguro de eliminar la categoría "${cat.nombre}"?`,
      submensaje: 'Esta acción no se puede deshacer.',
      icono: 'category',
      tipo: 'danger',
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.categoriaService.eliminar(cat.id).subscribe({
      next: () => this.cargarCategorias(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar la categoría'),
    });
  }
}
