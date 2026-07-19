import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {
  /** Mensaje opcional que aparece debajo del spinner */
  @Input() message = 'Cargando...';
  /** Tamaño del spinner: 'sm' | 'md' | 'lg' */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
