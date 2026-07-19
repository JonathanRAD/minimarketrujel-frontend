import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]',
  standalone: true
})
export class UppercaseDirective {
  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngControl: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const input = this.el.nativeElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    const originalValue = input.value;
    const upperValue = originalValue.toUpperCase();
    
    if (originalValue !== upperValue) {
      input.value = upperValue;
      
      // Actualizar el control del formulario reactivo de Angular si existe
      if (this.ngControl && this.ngControl.control) {
        this.ngControl.control.setValue(upperValue, { emitEvent: false });
      }
      
      // Restaurar la posición del cursor
      if (start !== null && end !== null) {
        input.setSelectionRange(start, end);
      }
    }
  }
}
