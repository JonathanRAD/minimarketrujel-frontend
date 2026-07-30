import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Cliente } from '../../../../../core/models/cliente.model';
import {
  ErrorAlertComponent,
  PageHeaderComponent,
  ConfirmModalService,
  GenericTableComponent,
  TableColumn,
} from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClienteFormPageComponent } from '../cliente-form/cliente-form.page';

@Component({
  selector: 'app-clientes-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ErrorAlertComponent,
    PageHeaderComponent,
    GenericTableComponent,
    MatDialogModule,
  ],
  templateUrl: './clientes-list.page.html',
  styleUrl: './clientes-list.page.scss',
})
export class ClientesListPageComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  clientes = signal<Cliente[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  columns: TableColumn<Cliente>[] = [
    { key: 'nombre', header: 'Cliente / Razón Social', sortable: true },
    { key: 'telefono', header: 'Teléfono', sortable: true, cellFn: (c) => c.telefono || '-' },
    { key: 'direccion', header: 'Dirección', sortable: true, cellFn: (c) => c.direccion || '-' },
    { key: 'limiteCredito', header: 'Límite Crédito', type: 'currency', sortable: true, align: 'right' },
    { key: 'deudaTotal', header: 'Deuda Actual', type: 'currency', sortable: true, align: 'right' },
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
    this.cargarClientes();
  }

  cargarClientes() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.clienteService.listar({ todo: true }).subscribe({
      next: (res) => {
        this.clientes.set(res.clientes);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar la lista de clientes');
      },
    });
  }

  abrirModalForm(clienteId?: string) {
    const dialogRef = this.dialog.open(ClienteFormPageComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { clienteId },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarClientes();
      }
    });
  }

  exportarExcel(): void {
    this.excelService.descargarExcel('clientes');
  }

  async eliminar(cli: Cliente) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Eliminar Cliente?',
      mensaje: `¿Estás seguro de eliminar al cliente "${cli.nombre}"?`,
      submensaje: 'Esta acción no se puede deshacer.',
      icono: 'person_off',
      tipo: 'danger',
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.clienteService.eliminar(cli.id).subscribe({
      next: () => this.cargarClientes(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar el cliente'),
    });
  }
}
