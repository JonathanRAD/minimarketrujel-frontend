import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { DashboardReporte } from '../../../../../core/models/reporte.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reporteService = inject(ReporteService);
  public excelService = inject(ReporteExcelService);

  data = signal<DashboardReporte | null>(null);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  filterForm = this.fb.group({
    fechaInicio: [''],
    fechaFin: [''],
  });

  ngOnInit() {
    this.limpiarFiltros();
  }

  cargarDashboard() {
    this.cargando.set(true);
    this.errorMessage.set(null);

    const values = this.filterForm.value;
    const inicio = values.fechaInicio || undefined;
    const fin = values.fechaFin || undefined;

    this.reporteService.obtenerDashboard(inicio, fin).subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar las estadÃ­sticas del dashboard');
      }
    });
  }

  limpiarFiltros() {
    const hoy = new Date();
    // Primer dÃ­a del mes
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Formatear a YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.filterForm.patchValue({
      fechaInicio: formatDate(primerDia),
      fechaFin: formatDate(hoy),
    });

    this.cargarDashboard();
  }

  calcularPorcentajeMetodo(totalMetodo: number): number {
    const total = this.data()?.resumenFinanciero?.ventasTotales || 0;
    if (total === 0) return 0;
    return (totalMetodo / total) * 100;
  }

  obtenerPorcentajeTopProducto(cantidad: number): number {
    const list = this.data()?.topProductos || [];
    if (list.length === 0) return 0;
    const max = Number(list[0].cantidadVendida) || 1;
    return (cantidad / max) * 100;
  }

  imprimirReporte() {
    document.body.classList.add('print-report-mode');
    window.print();
    document.body.classList.remove('print-report-mode');
  }

  exportarExcel(tabla: string): void {
    this.excelService.descargarExcel(tabla);
  }
}

