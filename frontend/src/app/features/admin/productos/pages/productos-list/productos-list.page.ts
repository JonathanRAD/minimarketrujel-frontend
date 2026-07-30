import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Producto } from '../../../../../core/models/producto.model';
import {
  ErrorAlertComponent,
  PageHeaderComponent,
  ConfirmModalService,
  GenericTableComponent,
  TableColumn,
} from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductoFormPageComponent } from '../producto-form/producto-form.page';

@Component({
  selector: 'app-productos-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ErrorAlertComponent,
    PageHeaderComponent,
    GenericTableComponent,
    MatDialogModule,
  ],
  templateUrl: './productos-list.page.html',
  styleUrl: './productos-list.page.scss',
})
export class ProductosListPageComponent implements OnInit {
  private productoService = inject(ProductoService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  columns: TableColumn<Producto>[] = [
    { key: 'nombre', header: 'Producto', sortable: true },
    { key: 'codigoBarras', header: 'Código', sortable: true },
    { key: 'precioVenta', header: 'Precio Venta', type: 'currency', sortable: true, align: 'right' },
    { key: 'costo', header: 'Costo', type: 'currency', sortable: true, align: 'right' },
    {
      key: 'stockActual',
      header: 'Stock',
      sortable: true,
      align: 'center',
      cellFn: (p) => `${p.stockActual} ${p.unidadMedida || 'UNIDAD'}`,
    },
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

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.productoService.listar({ todo: true }).subscribe({
      next: (res) => {
        this.productos.set(res.productos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar la lista de productos');
      },
    });
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
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar el producto'),
    });
  }
}
