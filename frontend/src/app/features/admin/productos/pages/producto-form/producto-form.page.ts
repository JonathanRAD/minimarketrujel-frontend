import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Categoria } from '../../../../../core/models/categoria.model';
import { UnidadMedida } from '../../../../../core/models/producto.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';
import { UppercaseDirective, OnlyNumbersDirective } from '@shared/directives';

@Component({
  selector: 'app-producto-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, UppercaseDirective, OnlyNumbersDirective],
  templateUrl: './producto-form.page.html',
  styleUrl: './producto-form.page.scss'
})
export class ProductoFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productoId.set(id);
      this.productoService.obtenerPorId(id).subscribe((producto) => {
        this.form.patchValue({
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras,
          precioVenta: Number(producto.precioVenta),
          costo: Number(producto.costo),
          stockActual: Number(producto.stockActual),
          stockMinimo: Number(producto.stockMinimo),
          unidadMedida: producto.unidadMedida,
          categoriaId: producto.categoriaId || '',
          imagenUrl: producto.imagenUrl || '',
        });
      });
    }
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data.filter(c => c.activo)),
      error: () => this.categorias.set([])
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);

    const values = this.form.getRawValue();
    const data = {
      ...values,
      categoriaId: values.categoriaId || null,
      imagenUrl: values.imagenUrl ? values.imagenUrl.trim() : null,
    };
    
    const id = this.productoId();

    const request = id
      ? this.productoService.actualizar(id, data as any)
      : this.productoService.crear(data as any);

    request.subscribe({
      next: () => this.router.navigate(['/admin/productos']),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err.error?.message ?? 'Error al guardar el producto');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Limitar tamaño a un máximo de 350px de ancho/alto
          const max_size = 350;
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            this.form.patchValue({
              imagenUrl: compressedBase64
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.form.patchValue({
      imagenUrl: ''
    });
  }
}