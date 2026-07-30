import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PromocionService } from '../../services/promocion.service';
import { Promocion } from '../../../../../core/models/promocion.model';
import {
  ErrorAlertComponent,
  PageHeaderComponent,
  ConfirmModalService,
  GenericTableComponent,
  TableColumn,
} from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PromocionFormPageComponent } from '../promocion-form/promocion-form.page';

@Component({
  selector: 'app-promociones-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ErrorAlertComponent,
    PageHeaderComponent,
    GenericTableComponent,
    MatDialogModule,
  ],
  templateUrl: './promociones-list.page.html',
  styleUrl: './promociones-list.page.scss',
})
export class PromocionesListPageComponent implements OnInit {
  private promocionService = inject(PromocionService);
  private confirmModal = inject(ConfirmModalService);
  private dialog = inject(MatDialog);

  promociones = signal<Promocion[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  columns: TableColumn<Promocion>[] = [
    { key: 'titulo', header: 'Título de la Oferta', sortable: true },
    { key: 'tipo', header: 'Tipo', sortable: true, cellFn: (p) => p.tipo || 'DESCUENTO' },
    { key: 'fechaInicio', header: 'Fecha Inicio', type: 'date', sortable: true },
    { key: 'fechaFin', header: 'Fecha Fin', type: 'date', sortable: true },
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
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.promocionService.listar({ limite: 100 }).subscribe({
      next: (res) => {
        this.promociones.set(res.promociones);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar el catálogo de promociones');
      },
    });
  }

  abrirModalForm(promocionId?: string) {
    const dialogRef = this.dialog.open(PromocionFormPageComponent, {
      width: '840px',
      maxWidth: '95vw',
      data: { promocionId },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargar();
      }
    });
  }

  async eliminar(promo: Promocion) {
    const seguro = await this.confirmModal.confirm({
      titulo: '¿Eliminar Oferta?',
      mensaje: `¿Estás seguro de eliminar la oferta "${promo.titulo}"?`,
      submensaje: 'Esta acción desactivará permanentemente esta promoción.',
      icono: 'local_offer',
      tipo: 'danger',
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.promocionService.eliminar(promo.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar la promoción'),
    });
  }
}
