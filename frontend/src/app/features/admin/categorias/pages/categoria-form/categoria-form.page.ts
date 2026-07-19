import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';
import { UppercaseDirective } from '@shared/directives';

@Component({
  selector: 'app-categoria-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, UppercaseDirective],
  templateUrl: './categoria-form.page.html',
  styleUrl: './categoria-form.page.scss'
})
export class CategoriaFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modoEditar = signal(false);
  categoriaId = signal<string | null>(null);
  cargandoDatos = signal(false);
  guardando = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    descripcion: ['', [Validators.maxLength(250)]],
    activo: [true],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEditar.set(true);
      this.categoriaId.set(id);
      this.cargarCategoria(id);
    }
  }

  cargarCategoria(id: string) {
    this.cargandoDatos.set(true);
    this.errorMessage.set(null);
    this.categoriaService.obtenerPorId(id).subscribe({
      next: (categoria) => {
        this.form.patchValue({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || '',
          activo: categoria.activo,
        });
        this.cargandoDatos.set(false);
      },
      error: (err) => {
        this.cargandoDatos.set(false);
        this.errorMessage.set(err.error?.message || 'No se pudieron cargar los datos de la categorÃ­a');
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;

    this.guardando.set(true);
    this.errorMessage.set(null);

    const values = this.form.getRawValue();
    const payload = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion?.trim() || undefined,
      activo: values.activo,
    };

    const request$ = this.modoEditar()
      ? this.categoriaService.actualizar(this.categoriaId()!, payload)
      : this.categoriaService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/admin/categorias']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar la categorÃ­a');
      }
    });
  }
}

