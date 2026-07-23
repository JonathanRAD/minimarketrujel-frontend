import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CompraService } from '../../services/compra.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { Compra } from '../../../../../core/models/compra.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent } from '@shared/components';

@Component({
  selector: 'app-compras-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, PaginationComponent],
  templateUrl: './compras-list.page.html',
  styleUrl: './compras-list.page.scss'
})
export class ComprasListPageComponent implements OnInit {
  private compraService = inject(CompraService);
  public excelService = inject(ReporteExcelService);

  compras = signal<Compra[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  // Paginación
  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);

  ngOnInit() {
    this.cargarCompras();
  }

  cargarCompras() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.compraService.listar({
      pagina: this.pagina(),
      limite: this.limite(),
    }).subscribe({
      next: (res) => {
        this.compras.set(res.compras);
        this.total.set(res.total);
        this.paginas.set(res.paginas);
        this.pagina.set(res.pagina);
        this.limite.set(res.limite);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar el historial de compras');
      }
    });
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarCompras();
  }

  cambiarLimite(l: number) {
    this.limite.set(l);
    this.pagina.set(1);
    this.cargarCompras();
  }

  exportarExcel(): void {
    this.excelService.descargarExcel('compras', 'Reporte_Compras.xlsx');
  }
}

