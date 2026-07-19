import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-alert.component.html',
  styleUrl: './error-alert.component.scss',
})
export class ErrorAlertComponent {
  /** Mensaje de error a mostrar. Si es null/undefined el componente no se renderiza. */
  @Input() message: string | null | undefined = null;
  /** Emite cuando el usuario hace clic en cerrar */
  @Output() dismiss = new EventEmitter<void>();
}
