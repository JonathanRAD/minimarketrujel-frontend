import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CompraService } from '../../services/compra.service';
import { ProveedorService } from '../../../proveedores/services/proveedor.service';
import { ProductoService } from '../../../productos/services/producto.service';
import { Proveedor } from '../../../../../core/models/proveedor.model';
import { Producto } from '../../../../../core/models/producto.model';
import { EstadoCompra, CrearCompraDetalleDto } from '../../../../../core/models/compra.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, BuscadorProductoComponent } from '@shared/components';

interface ItemCompraTemporal {
  producto: Producto;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-compra-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, BuscadorProductoComponent],
  templateUrl: './compra-form.page.html',
  styleUrl: './compra-form.page.scss'
})
export class CompraFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private compraService = inject(CompraService);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private router = inject(Router);

  proveedores = signal<Proveedor[]>([]);
  
  items = signal<ItemCompraTemporal[]>([]);
  guardando = signal(false);
  errorMessage = signal<string | null>(null);

  // Computeds
  totalArticulos = computed(() => this.items().reduce((acc, item) => acc + item.cantidad, 0));
  totalCompra = computed(() => this.items().reduce((acc, item) => acc + item.subtotal, 0));

  form = this.fb.nonNullable.group({
    proveedorId: ['', Validators.required],
    estado: ['RECIBIDA' as EstadoCompra, Validators.required],
  });

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.proveedorService.listar().subscribe({
      next: (data) => this.proveedores.set(data),
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al cargar proveedores')
    });
  }

  agregarItem(producto: Producto) {
    const list = this.items();
    const index = list.findIndex((i) => i.producto.id === producto.id);

    if (index !== -1) {
      this.actualizarCantidad(index, list[index].cantidad + 1);
    } else {
      this.items.update((arr) => [
        ...arr,
        {
          producto,
          cantidad: 1,
          costoUnitario: Number(producto.costo),
          subtotal: Number(producto.costo),
        },
      ]);
    }
  }

  actualizarCantidad(index: number, valor: string | number) {
    const cantidad = Math.max(1, Number(valor));
    this.items.update((arr) => {
      const clone = [...arr];
      clone[index] = {
        ...clone[index],
        cantidad,
        subtotal: cantidad * clone[index].costoUnitario,
      };
      return clone;
    });
  }

  actualizarCosto(index: number, valor: string | number) {
    const costoUnitario = Math.max(0, Number(valor));
    this.items.update((arr) => {
      const clone = [...arr];
      clone[index] = {
        ...clone[index],
        costoUnitario,
        subtotal: clone[index].cantidad * costoUnitario,
      };
      return clone;
    });
  }

  quitarItem(index: number) {
    this.items.update((arr) => arr.filter((_, idx) => idx !== index));
  }

  guardar() {
    if (this.form.invalid || this.items().length === 0) return;

    this.guardando.set(true);
    this.errorMessage.set(null);

    const values = this.form.getRawValue();
    const detallesDto: CrearCompraDetalleDto[] = this.items().map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      costoUnitario: item.costoUnitario,
    }));

    const payload = {
      proveedorId: values.proveedorId,
      estado: values.estado,
      detalles: detallesDto,
    };

    this.compraService.crear(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/admin/compras']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar la compra');
      }
    });
  }
}