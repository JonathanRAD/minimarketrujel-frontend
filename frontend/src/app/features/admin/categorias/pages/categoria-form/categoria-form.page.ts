import { Component, OnInit, inject, signal, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';
import { UppercaseDirective } from '@shared/directives';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-categoria-form-page',
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
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './categoria-form.page.html',
  styleUrl: './categoria-form.page.scss'
})
export class CategoriaFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @Optional() public dialogRef = inject(MatDialogRef<CategoriaFormPageComponent>, { optional: true });
  @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { categoriaId?: string } | null = inject(MAT_DIALOG_DATA, { optional: true });

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
    const id = this.dialogData?.categoriaId || this.route.snapshot.paramMap.get('id');
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
        this.errorMessage.set(err.error?.message || 'No se pudieron cargar los datos de la categoría');
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
        if (this.dialogRef) {
          this.dialogRef.close(true);
        } else {
          this.router.navigate(['/admin/categorias']);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar la categoría');
      }
    });
  }

  cerrar() {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    } else {
      this.router.navigate(['/admin/categorias']);
    }
  }
}
