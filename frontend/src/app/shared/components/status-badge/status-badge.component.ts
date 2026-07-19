import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  /** Texto del badge */
  @Input() label = '';
  /**
   * Variante visual. Si no se pasa, el componente intenta
   * deducirla automáticamente desde el label.
   */
  @Input() variant?: BadgeVariant;

  get resolvedVariant(): BadgeVariant {
    if (this.variant) return this.variant;
    // Auto-deducir por label común
    const l = this.label.toLowerCase();
    if (['activo', 'abierto', 'recibida', 'completada', 'pagada'].includes(l)) return 'success';
    if (['inactivo', 'cerrado', 'cancelada', 'anulada'].includes(l)) return 'neutral';
    if (['pendiente', 'en proceso'].includes(l)) return 'warning';
    if (['bajo stock', 'fiado', 'deuda'].includes(l)) return 'danger';
    return 'info';
  }
}
