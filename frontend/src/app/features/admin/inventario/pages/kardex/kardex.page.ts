import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { ReporteExcelService } from '../../../../../core/services/reporte-excel.service';
import { ProductoService } from '../../../productos/services/producto.service';
import { VentaService } from '../../../ventas/services/venta.service';
import { CompraService } from '../../../compras/services/compra.service';
import { MovimientoInventario } from '../../../../../core/models/inventario.model';
import { Producto } from '../../../../../core/models/producto.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, BuscadorProductoComponent } from '@shared/components';

@Component({
  selector: 'app-kardex-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, BuscadorProductoComponent],
  templateUrl: './kardex.page.html',
  styleUrl: './kardex.page.scss'
})
export class KardexPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private productoService = inject(ProductoService);
  private ventaService = inject(VentaService);
  private compraService = inject(CompraService);
  public excelService = inject(ReporteExcelService);

  movimientos = signal<MovimientoInventario[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  // Paginación
  pagina = signal<number>(1);
  limite = signal<number>(10);
  total = signal<number>(0);
  paginas = signal<number>(1);

  // Buscador de productos
  productoSeleccionado = signal<Producto | null>(null);

  filterForm = this.fb.group({
    tipo: [''],
    fechaInicio: [''],
    fechaFin: [''],
  });

  ngOnInit() {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.cargando.set(true);
    this.errorMessage.set(null);

    const values = this.filterForm.value;
    const filtros = {
      tipo: values.tipo ? (values.tipo as any) : undefined,
      productoId: this.productoSeleccionado()?.id || undefined,
      fechaInicio: values.fechaInicio || undefined,
      fechaFin: values.fechaFin || undefined,
      pagina: this.pagina(),
      limite: this.limite(),
    };

    this.inventarioService.listar(filtros).subscribe({
      next: (res) => {
        this.movimientos.set(res.movimientos);
        this.total.set(res.total);
        this.paginas.set(res.paginas);
        this.pagina.set(res.pagina);
        this.limite.set(res.limite);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar los movimientos del Kardex');
      }
    });
  }

  aplicarFiltros() {
    this.pagina.set(1);
    this.cargarMovimientos();
  }

  irAPagina(p: number) {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarMovimientos();
  }

  cambiarLimite(l: number) {
    this.limite.set(l);
    this.pagina.set(1);
    this.cargarMovimientos();
  }

  onLimiteChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.cambiarLimite(Number(target.value));
  }

  get arrayPaginas(): number[] {
    const total = this.paginas();
    const arr: number[] = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  }

  seleccionarProducto(producto: Producto) {
    this.productoSeleccionado.set(producto);
  }

  limpiarProducto() {
    this.productoSeleccionado.set(null);
  }

  limpiarFiltros() {
    this.filterForm.patchValue({
      tipo: '',
      fechaInicio: '',
      fechaFin: '',
    });
    this.limpiarProducto();
    this.cargarMovimientos();
  }

  esSalida(cantidad: number | string): boolean {
    return Number(cantidad) < 0;
  }

  getTipoVariant(tipo: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
    switch (tipo) {
      case 'COMPRA': return 'success';
      case 'VENTA': return 'info';
      case 'AJUSTE': return 'warning';
      case 'MERMA': return 'danger';
      case 'DEVOLUCION': return 'neutral';
      default: return 'neutral';
    }
  }

  // Detalle de Referencias (Modal)
  ventaSeleccionada = signal<any | null>(null);
  compraSeleccionada = signal<any | null>(null);
  cargandoDetalle = signal(false);

  verDetalleReferencia(mov: MovimientoInventario) {
    if (!mov.referenciaId) return;
    this.cargandoDetalle.set(true);
    this.errorMessage.set(null);

    if (mov.tipo === 'VENTA') {
      this.ventaService.obtenerPorId(mov.referenciaId).subscribe({
        next: (venta) => {
          this.ventaSeleccionada.set(venta);
          this.cargandoDetalle.set(false);
        },
        error: (err) => {
          this.cargandoDetalle.set(false);
          this.errorMessage.set(err.error?.message || 'Error al cargar el detalle de la venta');
        }
      });
    } else if (mov.tipo === 'COMPRA') {
      this.compraService.obtenerPorId(mov.referenciaId).subscribe({
        next: (compra) => {
          this.compraSeleccionada.set(compra);
          this.cargandoDetalle.set(false);
        },
        error: (err) => {
          this.cargandoDetalle.set(false);
          this.errorMessage.set(err.error?.message || 'Error al cargar el detalle de la compra');
        }
      });
    }
  }

  cerrarDetalles() {
    this.ventaSeleccionada.set(null);
    this.compraSeleccionada.set(null);
  }

  imprimir() {
    setTimeout(() => {
      document.body.classList.add('print-ticket-mode');
      window.print();
      document.body.classList.remove('print-ticket-mode');
    }, 250);
  }

  exportarExcel(): void {
    this.excelService.descargarExcel('inventario', 'Reporte_Inventario_Kardex.xlsx');
  }
}

