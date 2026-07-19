import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../../../../core/models/cliente.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent, ConfirmModalService } from '@shared/components';

@Component({
  selector: 'app-clientes-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent],
  templateUrl: './clientes-list.page.html',
  styleUrl: './clientes-list.page.scss'
})
export class ClientesListPageComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private confirmModal = inject(ConfirmModalService);

  clientes = signal<Cliente[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  // Paginación
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
      pagina: this.pagina(),
      limite: this.limite(),
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
        this.errorMessage.set(err.error?.message || 'Error al cargar los clientes');
      }
    });
  }

  async eliminar(cliente: Cliente) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Desactivar Cliente?',
      mensaje: `¿Estás seguro de que deseas desactivar al cliente "${cliente.nombre}"?`,
      submensaje: 'El cliente ya no estará activo para registrar ventas o créditos.',
      icono: 'person_off',
      tipo: 'warning',
      textoConfirmar: 'Sí, desactivar',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.errorMessage.set(null);
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => {
        this.cargarClientes();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'No se pudo eliminar el cliente');
      }
    });
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarClientes();
  }

  cambiarLimite(l: number) {
    this.limite.set(l);
    this.pagina.set(1);
    this.cargarClientes();
  }

  getDeudaTotal(cliente: Cliente): number {
    return Number(cliente.deudaTotal ?? 0);
  }
}

