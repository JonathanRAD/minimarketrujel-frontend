import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PromocionService } from '../../services/promocion.service';
import { Promocion } from '../../../../../core/models/promocion.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent, ConfirmModalService, TableFilterComponent, SortOption } from '@shared/components';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PromocionFormPageComponent } from '../promocion-form/promocion-form.page';

@Component({
  selector: 'app-promociones-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent, TableFilterComponent, MatDialogModule],
  templateUrl: './promociones-list.page.html',
  styleUrl: './promociones-list.page.scss'
})
export class PromocionesListPageComponent implements OnInit {
  private promocionService = inject(PromocionService);
  private confirmModal = inject(ConfirmModalService);
  private dialog = inject(MatDialog);

  promociones = signal<Promocion[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);
  busqueda = signal('');
  ordenarPor = signal('reciente');

  sortOptions: SortOption[] = [
    { label: 'Más reciente', value: 'reciente', icon: 'schedule' },
    { label: 'Más antiguo', value: 'antiguo', icon: 'history' },
    { label: 'Próximo a vencer', value: 'vencimiento_asc', icon: 'timer' },
    { label: 'Título A-Z', value: 'titulo_asc', icon: 'sort_by_alpha' },
  ];

  // Paginación
  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.promocionService.listar({
      busqueda: this.busqueda() || undefined,
      pagina: this.pagina(),
      limite: this.limite(),
      ordenarPor: this.ordenarPor(),
    }).subscribe({
      next: (res) => {
        this.promociones.set(res.promociones);
        this.total.set(res.total);
        this.paginas.set(res.paginas);
        this.pagina.set(res.pagina);
        this.limite.set(res.limite);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar el catálogo de promociones');
      }
    });
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargar();
  }

  cambiarOrden(orden: string): void {
    this.ordenarPor.set(orden);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargar();
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

  async toggleEstado(promo: Promocion) {
    const nuevoEstado = !promo.activo;
    this.promocionService.cambiarEstado(promo.id, nuevoEstado).subscribe({
      next: () => this.cargar(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al actualizar el estado')
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
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al eliminar la promoción')
    });
  }

  esVigente(promo: Promocion): boolean {
    if (!promo.activo) return false;
    const ahora = new Date();
    const inicio = new Date(promo.fechaInicio);
    const fin = new Date(promo.fechaFin);
    return ahora >= inicio && ahora <= fin;
  }
}
