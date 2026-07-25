import { Component, OnInit, inject, signal, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PromocionService } from '../../services/promocion.service';
import { ProductoService } from '../../../productos/services/producto.service';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Producto } from '../../../../../core/models/producto.model';
import { Categoria } from '../../../../../core/models/categoria.model';
import { TipoPromocion } from '../../../../../core/models/promocion.model';
import { SpinnerComponent, ErrorAlertComponent, PageHeaderComponent, BuscadorProductoComponent } from '@shared/components';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-promocion-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SpinnerComponent,
    ErrorAlertComponent,
    PageHeaderComponent,
    BuscadorProductoComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './promocion-form.page.html',
  styleUrl: './promocion-form.page.scss'
})
export class PromocionFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private promocionService = inject(PromocionService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @Optional() public dialogRef = inject(MatDialogRef<PromocionFormPageComponent>, { optional: true });
  @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { promocionId?: string } | null = inject(MAT_DIALOG_DATA, { optional: true });

  esEdicion = signal(false);
  promocionId = signal<string | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  errorMessage = signal<string | null>(null);

  categorias = signal<Categoria[]>([]);
  productoSeleccionado = signal<Producto | null>(null);
  alcanceTipo = signal<'PRODUCTO' | 'CATEGORIA'>('PRODUCTO');

  form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    tipo: ['PORCENTAJE' as TipoPromocion, [Validators.required]],
    categoriaId: [''],
    valorDescuento: [10, [Validators.min(0)]],
    cantidadMinima: [1, [Validators.required, Validators.min(1)]],
    cantidadGratis: [0, [Validators.min(0)]],
    fechaInicio: [this.obtenerFechaHoyISO(), [Validators.required]],
    fechaFin: [this.obtenerFechaFuturaISO(7), [Validators.required]],
    activo: [true],
  });

  ngOnInit() {
    this.cargarCategorias();
    const id = this.dialogData?.promocionId || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.promocionId.set(id);
      this.cargarPromocion(id);
    }
  }

  cargarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
    });
  }

  cargarPromocion(id: string) {
    this.cargando.set(true);
    this.promocionService.obtenerPorId(id).subscribe({
      next: (promo) => {
        this.form.patchValue({
          titulo: promo.titulo,
          descripcion: promo.descripcion || '',
          tipo: promo.tipo,
          categoriaId: promo.categoriaId || '',
          valorDescuento: promo.valorDescuento ? Number(promo.valorDescuento) : 0,
          cantidadMinima: promo.cantidadMinima || 1,
          cantidadGratis: promo.cantidadGratis || 0,
          fechaInicio: promo.fechaInicio.substring(0, 10),
          fechaFin: promo.fechaFin.substring(0, 10),
          activo: promo.activo,
        });

        if (promo.producto) {
          this.alcanceTipo.set('PRODUCTO');
          this.productoSeleccionado.set(promo.producto as any);
        } else if (promo.categoriaId) {
          this.alcanceTipo.set('CATEGORIA');
        }

        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar la promoción');
      }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.alcanceTipo() === 'PRODUCTO' && !this.productoSeleccionado()) {
      this.errorMessage.set('Debes seleccionar un producto para esta oferta');
      return;
    }

    if (this.alcanceTipo() === 'CATEGORIA' && !this.form.value.categoriaId) {
      this.errorMessage.set('Debes seleccionar una categoría para esta oferta');
      return;
    }

    this.guardando.set(true);
    this.errorMessage.set(null);

    const formVal = this.form.value;
    const payload: any = {
      titulo: formVal.titulo!,
      descripcion: formVal.descripcion || undefined,
      tipo: formVal.tipo!,
      productoId: this.alcanceTipo() === 'PRODUCTO' ? this.productoSeleccionado()?.id : null,
      categoriaId: this.alcanceTipo() === 'CATEGORIA' ? formVal.categoriaId : null,
      valorDescuento: Number(formVal.valorDescuento) || 0,
      cantidadMinima: Number(formVal.cantidadMinima) || 1,
      cantidadGratis: Number(formVal.cantidadGratis) || 0,
      fechaInicio: new Date(formVal.fechaInicio + 'T00:00:00').toISOString(),
      fechaFin: new Date(formVal.fechaFin + 'T23:59:59').toISOString(),
      activo: Boolean(formVal.activo),
    };

    const request$ = this.esEdicion() && this.promocionId()
      ? this.promocionService.actualizar(this.promocionId()!, payload)
      : this.promocionService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        if (this.dialogRef) {
          this.dialogRef.close(true);
        } else {
          this.router.navigate(['/admin/ofertas']);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar la promoción');
      }
    });
  }

  cerrar() {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    } else {
      this.router.navigate(['/admin/ofertas']);
    }
  }

  private obtenerFechaHoyISO(): string {
    return new Date().toISOString().substring(0, 10);
  }

  private obtenerFechaFuturaISO(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().substring(0, 10);
  }
}
