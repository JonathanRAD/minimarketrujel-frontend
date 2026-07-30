import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Categoria } from '../../../../../core/models/categoria.model';
import {
  ErrorAlertComponent,
  PageHeaderComponent,
  ConfirmModalService,
  GenericTableComponent,
  TableColumn,
} from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoriaFormPageComponent } from '../categoria-form/categoria-form.page';

@Component({
  selector: 'app-categorias-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ErrorAlertComponent,
    PageHeaderComponent,
    GenericTableComponent,
    MatDialogModule,
  ],
  templateUrl: './categorias-list.page.html',
  styleUrl: './categorias-list.page.scss',
})
export class CategoriasListPageComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  columns: TableColumn<Categoria>[] = [
    { key: 'nombre', header: 'Categoría', sortable: true },
    { key: 'descripcion', header: 'Descripción', sortable: true, cellFn: (c) => c.descripcion || '-' },
    {
      key: 'activo',
      header: 'Estado',
      type: 'badge',
      sortable: true,
      align: 'center',
      badgeMap: {
        true: { label: 'ACTIVO', class: 'badge-active' },
        false: { label: 'INACTIVO', class: 'badge-inactive' },
      },
    },
    { key: 'createdAt', header: 'Fecha Registrado', type: 'date', sortable: true },
  ];

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
      },
    });
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
