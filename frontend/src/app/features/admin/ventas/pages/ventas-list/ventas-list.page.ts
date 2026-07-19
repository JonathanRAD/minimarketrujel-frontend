import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VentaService } from '../../services/venta.service';
import { Venta, MetodoPago } from '../../../../../core/models/venta.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, BadgeVariant, PaginationComponent } from '@shared/components';

@Component({
  selector: 'app-ventas-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SpinnerComponent,
    ErrorAlertComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    PaginationComponent
  ],
  templateUrl: './ventas-list.page.html',
  styleUrl: './ventas-list.page.scss'
})
export class VentasListPageComponent implements OnInit {
  private ventaService = inject(VentaService);

  ventas = signal<Venta[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  errorMessage = signal<string | null>(null);

  // Paginación
  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);

  // Filtros de fecha
  filtroDesde = signal<string>('');
  filtroHasta = signal<string>('');

  // Detalle de ticket seleccionado
  ventaSeleccionada = signal<Venta | null>(null);

  ngOnInit() {
    this.cargarVentas();
  }

  cargarVentas() {
    this.cargando.set(true);
    this.errorMessage.set(null);

    const filtros = {
      desde: this.filtroDesde() ? new Date(this.filtroDesde() + 'T00:00:00') : undefined,
      hasta: this.filtroHasta() ? new Date(this.filtroHasta() + 'T23:59:59') : undefined,
    };

    // Convertimos las fechas a ISO string para la API
    const payload = {
      desde: filtros.desde?.toISOString(),
      hasta: filtros.hasta?.toISOString(),
      pagina: this.pagina(),
      limite: this.limite(),
    };

    this.ventaService.listar(payload).subscribe({
      next: (res) => {
        this.ventas.set(res.ventas);
        this.total.set(res.total);
        this.paginas.set(res.paginas);
        this.pagina.set(res.pagina);
        this.limite.set(res.limite);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar el historial de ventas');
      }
    });
  }

  filtrar() {
    this.pagina.set(1);
    this.cargarVentas();
  }

  limpiarFiltros() {
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.pagina.set(1);
    this.cargarVentas();
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarVentas();
  }

  cambiarLimite(l: number) {
    this.limite.set(l);
    this.pagina.set(1);
    this.cargarVentas();
  }

  verDetalle(venta: Venta) {
    this.cargando.set(true);
    this.ventaService.obtenerPorId(venta.id).subscribe({
      next: (detallada) => {
        this.ventaSeleccionada.set(detallada);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al obtener el detalle de la venta');
      }
    });
  }

  cerrarDetalle() {
    this.ventaSeleccionada.set(null);
  }

  anularVenta(id: string) {
    const confirmar = confirm('¿Estás seguro de que deseas anular esta venta? Esta acción devolverá el stock de todos los artículos involucrados al inventario y registrará un movimiento de devolución. No se puede deshacer.');
    if (!confirmar) return;

    this.guardando.set(true);
    this.errorMessage.set(null);

    this.ventaService.anular(id).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarDetalle();
        this.cargarVentas();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al intentar anular la venta');
      }
    });
  }

  getMetodoPagoVariant(metodo: MetodoPago): BadgeVariant {
    switch (metodo) {
      case 'EFECTIVO':
        return 'success';
      case 'TARJETA':
        return 'info';
      case 'MIXTO':
        return 'warning';
      case 'FIADO':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  getEstadoVariant(estado: string): BadgeVariant {
    return estado === 'COMPLETADA' ? 'success' : 'danger';
  }

  imprimirTicket(): void {
    document.body.classList.add('print-ticket-mode');
    window.print();
    document.body.classList.remove('print-ticket-mode');
  }
}
