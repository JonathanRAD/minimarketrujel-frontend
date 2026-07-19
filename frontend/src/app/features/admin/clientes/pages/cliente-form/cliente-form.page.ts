import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';
import { UppercaseDirective, OnlyNumbersDirective } from '@shared/directives';

@Component({
  selector: 'app-cliente-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, UppercaseDirective, OnlyNumbersDirective],
  templateUrl: './cliente-form.page.html',
  styleUrl: './cliente-form.page.scss'
})
export class ClienteFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modoEditar = signal(false);
  clienteId = signal<string | null>(null);
  cargandoDatos = signal(false);
  guardando = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    telefono: ['', [Validators.pattern('^[0-9]{9}$')]],
    direccion: ['', [Validators.maxLength(150)]],
    limiteCredito: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEditar.set(true);
      this.clienteId.set(id);
      this.cargarCliente(id);
    }
  }

  cargarCliente(id: string) {
    this.cargandoDatos.set(true);
    this.errorMessage.set(null);
    this.clienteService.obtenerPorId(id).subscribe({
      next: (cliente) => {
        this.form.patchValue({
          nombre: cliente.nombre,
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          limiteCredito: cliente.limiteCredito,
        });
        this.cargandoDatos.set(false);
      },
      error: (err) => {
        this.cargandoDatos.set(false);
        this.errorMessage.set(err.error?.message || 'No se pudieron cargar los datos del cliente');
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
      telefono: values.telefono?.trim() || undefined,
      direccion: values.direccion?.trim() || undefined,
      limiteCredito: Number(values.limiteCredito),
    };

    const request$ = this.modoEditar()
      ? this.clienteService.actualizar(this.clienteId()!, payload)
      : this.clienteService.crear(payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/admin/clientes']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar el cliente');
      }
    });
  }
}

