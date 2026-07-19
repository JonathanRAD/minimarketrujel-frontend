import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  /** Título principal de la página */
  @Input() title = '';
  /** Subtítulo/descripción debajo del título */
  @Input() subtitle = '';
  /**
   * Permite proyectar contenido adicional a la derecha (botones de acción).
   * Uso: <ng-content> dentro del componente.
   */
}
