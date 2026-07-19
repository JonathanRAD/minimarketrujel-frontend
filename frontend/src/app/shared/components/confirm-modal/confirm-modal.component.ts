import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalService } from './confirm-modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  private confirmService = inject(ConfirmModalService);

  mostrar = this.confirmService.mostrar;
  config = this.confirmService.config;

  confirmar(): void {
    this.confirmService.confirmar();
  }

  cancelar(): void {
    this.confirmService.cancelar();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent): void {
    if (!this.mostrar()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelar();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmar();
    }
  }
}
