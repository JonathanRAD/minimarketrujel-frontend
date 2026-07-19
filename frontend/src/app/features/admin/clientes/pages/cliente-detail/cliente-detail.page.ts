import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, Fiado } from '../../../../../core/models/cliente.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, ConfirmModalService } from '@shared/components';

@Component({
  selector: 'app-cliente-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './cliente-detail.page.html',
  styleUrl: './cliente-detail.page.scss'
})
export class ClienteDetailPageComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private route = inject(ActivatedRoute);
  private confirmModal = inject(ConfirmModalService);

  cliente = signal<Cliente | null>(null);
  fiados = signal<Fiado[]>([]);
  cargando = signal(true);
  cargandoFiados = signal(false);
  cobrandoId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Computeds
  deudaTotal = computed(() => this.cliente()?.deudaTotal || 0);
  creditoDisponible = computed(() => {
    const cli = this.cliente();
    if (!cli) return 0;
    return Math.max(0, cli.limiteCredito - cli.deudaTotal);
  });
  
  porcentajeCredito = computed(() => {
    const cli = this.cliente();
    if (!cli || cli.limiteCredito === 0) return 0;
    return Math.min(100, (cli.deudaTotal / cli.limiteCredito) * 100);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatos(id);
    }
  }

  cargarDatos(id: string) {
    this.cargando.set(true);
    this.errorMessage.set(null);
    
    this.clienteService.obtenerPorId(id).subscribe({
      next: (cli) => {
        this.cliente.set(cli);
        this.cargando.set(false);
        this.cargarFiados(id);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar los datos del cliente');
      }
    });
  }

  cargarFiados(clienteId: string) {
    this.cargandoFiados.set(true);
    this.clienteService.listarFiados(clienteId).subscribe({
      next: (data) => {
        this.fiados.set(data);
        this.cargandoFiados.set(false);
      },
      error: (err) => {
        this.cargandoFiados.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar el detalle de deudas');
      }
    });
  }

  async cobrar(fiado: Fiado) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Saldar Deuda de Cliente?',
      mensaje: `¿Confirmas que el cliente está saldando la deuda de S/ ${fiado.monto}?`,
      submensaje: 'La deuda quedará registrada como pagada.',
      icono: 'payments',
      tipo: 'info',
      textoConfirmar: 'Sí, registrar pago',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.cobrandoId.set(fiado.id);
    this.errorMessage.set(null);

    this.clienteService.pagarFiado(fiado.id).subscribe({
      next: () => {
        this.cobrandoId.set(null);
        // Filtrar localmente el fiado pagado
        this.fiados.update(list => list.filter(f => f.id !== fiado.id));
        
        // Actualizar la deuda total en el cliente local restando el monto pagado
        this.cliente.update(cli => {
          if (!cli) return null;
          return {
            ...cli,
            deudaTotal: Math.max(0, cli.deudaTotal - fiado.monto),
          };
        });
      },
      error: (err) => {
        this.cobrandoId.set(null);
        this.errorMessage.set(err.error?.message || 'Error al procesar el cobro');
      }
    });
  }
}

