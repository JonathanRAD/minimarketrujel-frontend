import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() pagina = 1;
  @Input() limite = 10;
  @Input() total = 0;
  @Input() paginas = 1;

  @Output() paginaChange = new EventEmitter<number>();
  @Output() limiteChange = new EventEmitter<number>();

  get arrayPaginas(): number[] {
    const totalPages = this.paginas;
    const current = this.pagina;
    const visibleRange = 2;
    const arr: number[] = [];

    let start = Math.max(1, current - visibleRange);
    let end = Math.min(totalPages, current + visibleRange);

    if (current <= visibleRange) {
      end = Math.min(totalPages, start + (visibleRange * 2));
    }
    if (current + visibleRange >= totalPages) {
      start = Math.max(1, end - (visibleRange * 2));
    }

    for (let i = start; i <= end; i++) {
      arr.push(i);
    }
    return arr;
  }

  get minRecord(): number {
    if (this.total === 0) return 0;
    return (this.pagina - 1) * this.limite + 1;
  }

  get maxRecord(): number {
    return Math.min(this.pagina * this.limite, this.total);
  }

  onPageChange(p: number) {
    if (p < 1 || p > this.paginas || p === this.pagina) return;
    this.paginaChange.emit(p);
  }

  onLimitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.limiteChange.emit(Number(target.value));
  }
}
