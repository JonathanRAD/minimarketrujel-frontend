import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Categoria } from '../../../../../core/models/categoria.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, ConfirmModalService } from '@shared/components';

@Component({
  selector: 'app-categorias-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './categorias-list.page.html',
  styleUrl: './categorias-list.page.scss'
})
export class CategoriasListPageComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);

  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.categoriaService.listar().subscribe({
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

  async eliminar(categoria: Categoria) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Eliminar Categoría?',
      mensaje: `¿Estás seguro de que deseas eliminar la categoría "${categoria.nombre}"?`,
      submensaje: 'Esta acción no se puede deshacer.',
      icono: 'delete_forever',
      tipo: 'danger',
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.errorMessage.set(null);
    this.categoriaService.eliminar(categoria.id).subscribe({
      next: () => {
        // Remover de la lista local
        this.categorias.update(cats => cats.filter(c => c.id !== categoria.id));
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'No se pudo eliminar la categoría');
      }
    });
  }

  toggleEstado(categoria: Categoria) {
    this.errorMessage.set(null);
    const nuevoEstado = !categoria.activo;
    
    this.categoriaService.actualizar(categoria.id, { activo: nuevoEstado }).subscribe({
      next: () => {
        this.categorias.update(cats =>
          cats.map(c => c.id === categoria.id ? { ...c, activo: nuevoEstado } : c)
        );
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'No se pudo cambiar el estado de la categoría');
      }
    });
  }

  exportarExcel(): void {
    this.excelService.descargarExcel('categorias', 'Reporte_Categorias.xlsx');
  }
}
