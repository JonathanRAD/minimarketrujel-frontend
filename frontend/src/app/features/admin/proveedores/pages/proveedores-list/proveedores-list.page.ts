// Componente de listado de proveedores para el Back-office
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { Proveedor } from '../../../../../core/models/proveedor.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';

@Component({
  selector: 'app-proveedores-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './proveedores-list.page.html',
  styleUrl: './proveedores-list.page.scss'
})
export class ProveedoresListPageComponent implements OnInit {
  private proveedorService = inject(ProveedorService);

  proveedores = signal<Proveedor[]>([]);
  cargando = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.proveedorService.listar().subscribe({
      next: (data) => {
        this.proveedores.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar los proveedores');
      }
    });
  }

  eliminar(proveedor: Proveedor) {
    const seguro = confirm(`Â¿EstÃ¡s seguro de que deseas desactivar al proveedor "${proveedor.nombre}"?`);
    if (!seguro) return;

    this.errorMessage.set(null);
    this.proveedorService.eliminar(proveedor.id).subscribe({
      next: () => {
        this.proveedores.update(provs => provs.filter(p => p.id !== proveedor.id));
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'No se pudo eliminar el proveedor');
      }
    });
  }
}

