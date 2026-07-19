// Componente de formulario de proveedor para creaciÃ³n y ediciÃ³n
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';
import { UppercaseDirective, OnlyNumbersDirective } from '@shared/directives';

@Component({
  selector: 'app-proveedor-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, UppercaseDirective, OnlyNumbersDirective],
  templateUrl: './proveedor-form.page.html',
  styleUrl: './proveedor-form.page.scss'
})
export class ProveedorFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modoEditar = signal(false);
  proveedorId = signal<string | null>(null);
  cargandoDatos = signal(false);
  guardando = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    contacto: ['', [Validators.maxLength(80)]],
    telefono: ['', [Validators.pattern('^[0-9]{9}$')]],
    email: ['', [Validators.email]],
    direccion: ['', [Validators.maxLength(150)]],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEditar.set(true);
      this.proveedorId.set(id);
      this.cargarProveedor(id);
    }
  }

  cargarProveedor(id: string) {
    this.cargandoDatos.set(true);
    this.errorMessage.set(null);
    this.proveedorService.obtenerPorId(id).subscribe({
      next: (proveedor) => {
        this.form.patchValue({
          nombre: proveedor.nombre,
          contacto: proveedor.contacto || '',
          telefono: proveedor.telefono || '',
          email: proveedor.email || '',
          direccion: proveedor.direccion || '',
        });
        this.cargandoDatos.set(false);
      },
      error: (err) => {
        this.cargandoDatos.set(false);
        this.errorMessage.set(err.error?.message || 'No se pudieron cargar los datos del proveedor');
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
      contacto: values.contacto?.trim() || undefined,
      telefono: values.telefono?.trim() || undefined,
      email: values.email?.trim() || undefined,
      direccion: values.direccion?.trim() || undefined,
    };

    const request$ = this.modoEditar()
      ? this.proveedorService.actualizar(this.proveedorId()!, payload)
      : this.proveedorService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/admin/proveedores']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar el proveedor');
      }
    });
  }
}

