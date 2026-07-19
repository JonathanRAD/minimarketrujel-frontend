import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { ProductoService } from '../../../productos/services/producto.service';
import { Producto } from '../../../../../core/models/producto.model';
import { TipoAjuste } from '../../../../../core/models/inventario.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, BuscadorProductoComponent } from '@shared/components';

@Component({
  selector: 'app-ajuste-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, BuscadorProductoComponent],
  templateUrl: './ajuste-form.page.html',
  styleUrl: './ajuste-form.page.scss'
})
export class AjusteFormPageComponent {
  private fb = inject(FormBuilder);
  private inventarioService = inject(InventarioService);
  private productoService = inject(ProductoService);
  private router = inject(Router);

  productoSeleccionado = signal<Producto | null>(null);
  
  sentido = signal<'ENTRADA' | 'SALIDA'>('SALIDA'); // por defecto restamos (salida por merma/pérdida)
  guardando = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    tipo: ['MERMA' as TipoAjuste, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    motivo: ['', [Validators.required, Validators.minLength(5)]],
  });

  seleccionarProducto(producto: Producto) {
    this.productoSeleccionado.set(producto);
  }

  deseleccionarProducto() {
    this.productoSeleccionado.set(null);
  }

  cambiarSentido(sentido: 'ENTRADA' | 'SALIDA') {
    this.sentido.set(sentido);
    
    // Cambiar por defecto el tipo de ajuste de acuerdo al sentido
    if (sentido === 'ENTRADA') {
      this.form.patchValue({ tipo: 'DEVOLUCION' });
    } else {
      this.form.patchValue({ tipo: 'MERMA' });
    }
  }

  guardar() {
    if (this.form.invalid || !this.productoSeleccionado()) return;

    this.guardando.set(true);
    this.errorMessage.set(null);

    const values = this.form.getRawValue();
    const cantidadNeta = this.sentido() === 'ENTRADA' 
      ? Number(values.cantidad) 
      : -Number(values.cantidad);

    const payload = {
      productoId: this.productoSeleccionado()!.id,
      tipo: values.tipo,
      cantidad: cantidadNeta,
      motivo: values.motivo.trim(),
    };

    this.inventarioService.crearAjuste(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/admin/inventario']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al procesar el ajuste de stock');
      }
    });
  }
}

