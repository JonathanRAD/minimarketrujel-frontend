import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appOnlyNumbers]',
  standalone: true
})
export class OnlyNumbersDirective {
  private navigationKeys = [
    'Backspace',
    'Tab',
    'End',
    'Home',
    'ArrowLeft',
    'ArrowRight',
    'Delete',
    'Enter'
  ];

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Permitir teclas de navegación especiales
    if (
      this.navigationKeys.indexOf(event.key) > -1 ||
      // Permitir: Ctrl+A, Command+A
      (event.key === 'a' && (event.ctrlKey || event.metaKey)) ||
      // Permitir: Ctrl+C, Command+C
      (event.key === 'c' && (event.ctrlKey || event.metaKey)) ||
      // Permitir: Ctrl+V, Command+V
      (event.key === 'v' && (event.ctrlKey || event.metaKey)) ||
      // Permitir: Ctrl+X, Command+X
      (event.key === 'x' && (event.ctrlKey || event.metaKey))
    ) {
      return; // Dejar pasar el evento
    }

    // Asegurarse de que sea un número. Si no, bloquear el evento
    if (event.key === ' ' || isNaN(Number(event.key))) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData ? clipboardData.getData('text') : '';
    
    // Si el texto pegado contiene caracteres que no son números, prevenir el pegado
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
