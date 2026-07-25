import { Component, OnInit, inject, signal, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Categoria } from '../../../../../core/models/categoria.model';
import { UnidadMedida } from '../../../../../core/models/producto.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';
import { UppercaseDirective, OnlyNumbersDirective } from '@shared/directives';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-producto-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SpinnerComponent,
    ErrorAlertComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    UppercaseDirective,
    OnlyNumbersDirective,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './producto-form.page.html',
  styleUrl: './producto-form.page.scss'
})
export class ProductoFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @Optional() public dialogRef = inject(MatDialogRef<ProductoFormPageComponent>, { optional: true });
  @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { productoId?: string } | null = inject(MAT_DIALOG_DATA, { optional: true });

  productoId = signal<string | null>(null);
  guardando = signal(false);
  error = signal<string | null>(null);
  categorias = signal<Categoria[]>([]);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    codigoBarras: ['', [Validators.required, Validators.pattern('^[0-9]{8,13}$')]],
    precioVenta: [0, [Validators.required, Validators.min(0.01)]],
    costo: [0, [Validators.required, Validators.min(0)]],
    stockActual: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [5, [Validators.required, Validators.min(0)]],
    unidadMedida: ['UNIDAD' as UnidadMedida, Validators.required],
    categoriaId: ['', Validators.required],
    imagenUrl: [''],
  });

  ngOnInit(): void {
    this.cargarCategorias();

    const id = this.dialogData?.productoId || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productoId.set(id);
      this.cargarProducto(id);
    }
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => this.error.set('Error al cargar la lista de categorías.'),
    });
  }

  cargarProducto(id: string): void {
    this.productoService.obtenerPorId(id).subscribe({
      next: (prod) => {
        this.form.patchValue({
          nombre: prod.nombre,
          codigoBarras: prod.codigoBarras,
          precioVenta: Number(prod.precioVenta),
          costo: Number(prod.costo),
          stockActual: Number(prod.stockActual),
          stockMinimo: Number(prod.stockMinimo),
          unidadMedida: prod.unidadMedida,
          categoriaId: prod.categoriaId || '',
          imagenUrl: prod.imagenUrl || '',
        });
      },
      error: () => this.error.set('No se pudo cargar la información del producto.'),
    });
  }

  isDragging = signal(false);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compilar a JPEG ultra ligero (~30KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        this.form.patchValue({ imagenUrl: compressedBase64 });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.form.patchValue({ imagenUrl: '' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const formVal = this.form.getRawValue();
    const payload = {
      ...formVal,
      nombre: formVal.nombre.trim(),
      imagenUrl: formVal.imagenUrl || undefined,
    };

    const id = this.productoId();
    const request$ = id
      ? this.productoService.actualizar(id, payload)
      : this.productoService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        if (this.dialogRef) {
          this.dialogRef.close(true);
        } else {
          this.router.navigate(['/admin/productos']);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.message || 'Ocurrió un error al guardar el producto.');
      },
    });
  }

  cerrar(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    } else {
      this.router.navigate(['/admin/productos']);
    }
  }
}