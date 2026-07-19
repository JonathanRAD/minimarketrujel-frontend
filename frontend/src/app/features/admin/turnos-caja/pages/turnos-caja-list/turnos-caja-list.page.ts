import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TurnoCajaService } from '../../services/turno-caja.service';
import { TurnoCaja } from '../../../../../core/models/turno-caja.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent } from '@shared/components';

@Component({
  selector: 'app-turnos-caja-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent],
  templateUrl: './turnos-caja-list.page.html',
  styleUrl: './turnos-caja-list.page.scss'
})
export class TurnosCajaListPageComponent implements OnInit {
  private turnoCajaService = inject(TurnoCajaService);

  turnos = signal<TurnoCaja[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  // Paginación
  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);
  
  // Detalle del Arqueo
  turnoSeleccionado = signal<TurnoCaja | null>(null);

  ngOnInit() {
    this.cargarTurnos();
  }

  cargarTurnos() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.turnoCajaService.listar({
      pagina: this.pagina(),
      limite: this.limite(),
    }).subscribe({
      next: (res) => {
        this.turnos.set(res.turnos);
        this.total.set(res.total);
        this.paginas.set(res.paginas);
        this.pagina.set(res.pagina);
        this.limite.set(res.limite);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar el historial de turnos de caja');
      }
    });
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarTurnos();
  }

  cambiarLimite(l: number) {
    this.limite.set(l);
    this.pagina.set(1);
    this.cargarTurnos();
  }

  seleccionarTurno(turno: TurnoCaja) {
    this.turnoSeleccionado.set(turno);
  }

  cerrarDetalle() {
    this.turnoSeleccionado.set(null);
  }

  esDiferenciaNegativa(diff: number | string | null | undefined): boolean {
    return Number(diff || 0) < 0;
  }

  esDiferenciaCero(diff: number | string | null | undefined): boolean {
    return Number(diff || 0) === 0;
  }

  obtenerDenominacionesLista(conteo: any) {
    if (!conteo) return [];
    const nombresMap: { [key: string]: { label: string; valor: number } } = {
      b200: { label: 'Billetes S/ 200', valor: 200 },
      b100: { label: 'Billetes S/ 100', valor: 100 },
      b50: { label: 'Billetes S/ 50', valor: 50 },
      b20: { label: 'Billetes S/ 20', valor: 20 },
      b10: { label: 'Billetes S/ 10', valor: 10 },
      m5: { label: 'Monedas S/ 5', valor: 5 },
      m2: { label: 'Monedas S/ 2', valor: 2 },
      m1: { label: 'Monedas S/ 1', valor: 1 },
      m050: { label: 'Monedas S/ 0.50', valor: 0.50 },
      m020: { label: 'Monedas S/ 0.20', valor: 0.20 },
      m010: { label: 'Monedas S/ 0.10', valor: 0.10 },
    };
    
    return Object.keys(conteo)
      .filter((key) => conteo[key] > 0 && nombresMap[key])
      .map((key) => {
        const info = nombresMap[key];
        const cant = Number(conteo[key]);
        return {
          label: info.label,
          cantidad: cant,
          subtotal: cant * info.valor
        };
      });
  }
}

