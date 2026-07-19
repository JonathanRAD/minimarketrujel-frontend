import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Input invisible/minimalista que se mantiene SIEMPRE enfocado en la pantalla
 * de venta. La pistola lectora funciona como teclado (modo HID), así que
 * mientras el foco esté aquí, escanear un producto llena este campo solo
 * y al final dispara un Enter automático -> emitimos el código.
 */

@Component({
  selector: 'app-scanner-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './scanner-input.component.html',
  styleUrl: './scanner-input.component.scss',
})
export class ScannerInputComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scannerInput') inputRef!: ElementRef<HTMLInputElement>;
  @Output() codigoEscaneado = new EventEmitter<string>();

  codigoActual = '';
  private timeoutId: any = null;

  ngAfterViewInit(): void {
    this.enfocar();
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
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

  /**
   * Maneja cada carácter ingresado por la pistola o teclado.
   * Si detecta acumulación anómala (más de 20 caracteres) o inactividad de 500ms sin Enter,
   * limpia el buffer para evitar que se concatenen dos códigos de barras.
   */
  onInputChange(): void {
    const rawValue = this.inputRef?.nativeElement?.value || '';

    // Si el valor acumulado supera los 20 caracteres sin haber presionado Enter,
    // significa que se concatenaron dos escaneos o hubo un error de lectura.
    if (rawValue.length > 20) {
      this.limpiarBuffer();
      return;
    }

    // Reiniciar temporizador de limpieza por inactividad
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      // Si pasan 500ms sin que llegue Enter, asumimos escaneo incompleto o tipeo abandonado y limpiamos
      this.limpiarBuffer();
    }, 500);
  }

  /**
   * Procesa el código al presionar Enter.
   * Limpia SÍNCRONAMENTE el elemento HTML del DOM para garantizar que la pistola
   * no escriba sobre el código anterior en el siguiente escaneo.
   */
  emitirCodigo(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Obtener el valor directamente del DOM para máxima velocidad y sincronización con el escáner HID
    const rawValue = this.inputRef?.nativeElement?.value || this.codigoActual || '';
    const codigo = rawValue.trim();

    // Limpieza síncrona inmediata del DOM y de la propiedad de Angular
    this.limpiarBuffer();

    if (codigo) {
      this.codigoEscaneado.emit(codigo);
    }

    this.enfocar();
  }

  private limpiarBuffer(): void {
    if (this.inputRef?.nativeElement) {
      this.inputRef.nativeElement.value = '';
    }
    this.codigoActual = '';
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private enfocar(): void {
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 0);
  }
}
