import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CompraService } from '../../services/compra.service';
import { Compra } from '../../../../../core/models/compra.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, ConfirmModalService } from '@shared/components';

@Component({
  selector: 'app-compra-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './compra-detail.page.html',
  styleUrl: './compra-detail.page.scss'
})
export class CompraDetailPageComponent implements OnInit {
  private compraService = inject(CompraService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmModal = inject(ConfirmModalService);

  compra = signal<Compra | null>(null);
  cargando = signal(true);
  anulando = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCompra(id);
    }
  }

  cargarCompra(id: string) {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.compraService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.compra.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar los detalles de la compra');
      }
    });
  }

  async anularCompra() {
    const compraId = this.compra()?.id;
    if (!compraId) return;

    const seguro = await this.confirmModal.confirm({
      titulo: '¿Anular Compra?',
      mensaje: '¿Estás completamente seguro de que deseas anular esta compra?',
      submensaje: 'Esta acción restará automáticamente del inventario el stock ingresado por esta compra.',
      icono: 'remove_shopping_cart',
      tipo: 'danger',
      textoConfirmar: 'Sí, anular compra',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.anulando.set(true);
    this.errorMessage.set(null);

    this.compraService.actualizarEstado(compraId, 'CANCELADA').subscribe({
      next: (compraActualizada) => {
        this.anulando.set(false);
        this.compra.set(compraActualizada);
      },
      error: (err) => {
        this.anulando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al intentar anular la compra');
      }
    });
  }
}

