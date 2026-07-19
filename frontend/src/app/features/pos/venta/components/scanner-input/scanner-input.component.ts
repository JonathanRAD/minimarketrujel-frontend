import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Input invisible/minimalista que se mantiene SIEMPRE enfocado en la pantalla
 * de venta. La pistola lectora funciona como teclado (modo HID), asÃ­ que
 * mientras el foco estÃ© aquÃ­, escanear un producto llena este campo solo
 * y al final dispara un Enter automÃ¡tico -> emitimos el cÃ³digo.
 */

@Component({
  selector: 'app-scanner-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './scanner-input.component.html',
  styleUrl: './scanner-input.component.scss'
})
export class ScannerInputComponent implements AfterViewInit {
  @ViewChild('scannerInput') inputRef!: ElementRef<HTMLInputElement>;
  @Output() codigoEscaneado = new EventEmitter<string>();

  codigoActual = '';

  ngAfterViewInit(): void {
    this.enfocar();
  }

  // Si el usuario hace clic en la pantalla, regresa el foco aquí, excepto si hace clic en inputs/modales
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('.modal-overlay') ||
      target.closest('.modal-card')
    ) {
      return; // Dejar que el foco se mantenga en el elemento interactivo seleccionado
    }
    this.enfocar();
  }

  emitirCodigo(): void {
    const codigo = this.codigoActual.trim();
    if (codigo) {
      this.codigoEscaneado.emit(codigo);
    }
    this.codigoActual = '';
    this.enfocar();
  }

  private enfocar(): void {
    setTimeout(() => this.inputRef?.nativeElement.focus(), 0);
  }
}

