import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Cliente } from '../../../../../core/models/cliente.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, ConfirmModalService, PaginationComponent, TableFilterComponent, SortOption } from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClienteFormPageComponent } from '../cliente-form/cliente-form.page';

@Component({
  selector: 'app-clientes-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent, TableFilterComponent, MatDialogModule],
  templateUrl: './clientes-list.page.html',
  styleUrl: './clientes-list.page.scss'
})
export class ClientesListPageComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private confirmModal = inject(ConfirmModalService);
  public excelService = inject(ReporteExcelService);
  private dialog = inject(MatDialog);

  clientes = signal<Cliente[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);
  busqueda = signal('');
  ordenarPor = signal('reciente');

  sortOptions: SortOption[] = [
    { label: 'Más reciente', value: 'reciente', icon: 'schedule' },
    { label: 'Más antiguo', value: 'antiguo', icon: 'history' },
    { label: 'Nombre A-Z', value: 'nombre_asc', icon: 'sort_by_alpha' },
    { label: 'Mayor Deuda', value: 'deuda_desc', icon: 'payments' },
  ];

  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.cargando.set(true);
    this.errorMessage.set(null);

    this.clienteService.listar({
      busqueda: this.busqueda() || undefined,
      pagina: this.pagina(),
      limite: this.limite(),
      ordenarPor: this.ordenarPor(),
    }).subscribe({
      next: (res) => {
        this.clientes.set(res.clientes);
        this.total.set(res.total);
        this.paginas.set(res.paginas);
        this.pagina.set(res.pagina);
        this.limite.set(res.limite);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar la lista de clientes');
      }
    });
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargarClientes();
  }

  cambiarOrden(orden: string): void {
    this.ordenarPor.set(orden);
    this.pagina.set(1);
    this.cargarClientes();
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarClientes();
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

  cambiarLimite(limite: number): void {
    this.limite.set(limite);
    this.pagina.set(1);
    this.cargarClientes();
  }

  getDeudaTotal(cliente: Cliente): number {
    return Number(cliente.deudaTotal || 0);
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
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar el cliente')
    });
  }
}
