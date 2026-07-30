import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Proveedor } from '../../../../../core/models/proveedor.model';
import {
  ErrorAlertComponent,
  PageHeaderComponent,
  ConfirmModalService,
  GenericTableComponent,
  TableColumn,
} from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProveedorFormPageComponent } from '../proveedor-form/proveedor-form.page';

@Component({
  selector: 'app-proveedores-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ErrorAlertComponent,
    PageHeaderComponent,
    GenericTableComponent,
    MatDialogModule,
  ],
  templateUrl: './proveedores-list.page.html',
  styleUrl: './proveedores-list.page.scss',
})
export class ProveedoresListPageComponent implements OnInit {
  private proveedorService = inject(ProveedorService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  proveedores = signal<Proveedor[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  columns: TableColumn<Proveedor>[] = [
    { key: 'nombre', header: 'Proveedor / Razón Social', sortable: true },
    { key: 'contacto', header: 'Contacto', sortable: true, cellFn: (p) => p.contacto || '-' },
    { key: 'telefono', header: 'Teléfono', sortable: true, cellFn: (p) => p.telefono || '-' },
    { key: 'email', header: 'Correo Electrónico', sortable: true, cellFn: (p) => p.email || '-' },
    { key: 'direccion', header: 'Dirección', sortable: true, cellFn: (p) => p.direccion || '-' },
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
  ];

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.proveedorService.listar().subscribe({
      next: (data) => {
        this.proveedores.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar la lista de proveedores');
      },
    });
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
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar el proveedor'),
    });
  }
}
