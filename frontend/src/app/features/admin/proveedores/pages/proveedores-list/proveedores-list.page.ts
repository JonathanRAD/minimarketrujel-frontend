import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Proveedor } from '../../../../../core/models/proveedor.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, ConfirmModalService, PaginationComponent, TableFilterComponent, SortOption } from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProveedorFormPageComponent } from '../proveedor-form/proveedor-form.page';

@Component({
  selector: 'app-proveedores-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent, TableFilterComponent, MatDialogModule],
  templateUrl: './proveedores-list.page.html',
  styleUrl: './proveedores-list.page.scss'
})
export class ProveedoresListPageComponent implements OnInit {
  private proveedorService = inject(ProveedorService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  proveedores = signal<Proveedor[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);
  busqueda = signal('');
  ordenarPor = signal('reciente');

  sortOptions: SortOption[] = [
    { label: 'Más reciente', value: 'reciente', icon: 'schedule' },
    { label: 'Más antiguo', value: 'antiguo', icon: 'history' },
    { label: 'Nombre A-Z', value: 'nombre_asc', icon: 'sort_by_alpha' },
  ];

  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.cargando.set(true);
    this.errorMessage.set(null);

    this.proveedorService.listar({
      busqueda: this.busqueda() || undefined,
      ordenarPor: this.ordenarPor(),
    }).subscribe({
      next: (data) => {
        this.proveedores.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar la lista de proveedores');
      }
    });
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargarProveedores();
  }

  cambiarOrden(orden: string): void {
    this.ordenarPor.set(orden);
    this.pagina.set(1);
    this.cargarProveedores();
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarProveedores();
  }

  abrirModalForm(proveedorId?: string) {
    const dialogRef = this.dialog.open(ProveedorFormPageComponent, {
      width: '580px',
      maxWidth: '95vw',
      data: { proveedorId },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarProveedores();
      }
    });
  }

  cambiarLimite(limite: number): void {
    this.limite.set(limite);
    this.pagina.set(1);
    this.cargarProveedores();
  }

  exportarExcel(): void {
    this.excelService.descargarExcel('proveedores');
  }

  async eliminar(prov: Proveedor) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Eliminar Proveedor?',
      mensaje: `¿Estás seguro de eliminar el proveedor "${prov.nombre}"?`,
      submensaje: 'Esta acción no se puede deshacer.',
      icono: 'local_shipping',
      tipo: 'danger',
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.proveedorService.eliminar(prov.id).subscribe({
      next: () => this.cargarProveedores(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar el proveedor')
    });
  }

  trackById(index: number, item: { id: string }): string {
    return item.id;
  }
}
