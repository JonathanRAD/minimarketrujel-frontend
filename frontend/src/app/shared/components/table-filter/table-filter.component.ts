import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SortOption {
  label: string;
  value: string;
  icon?: string;
}

@Component({
  selector: 'app-table-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-filter.component.html',
  styleUrl: './table-filter.component.scss'
})
export class TableFilterComponent {
  @Input() options: SortOption[] = [];
  @Input() selectedValue: string = 'reciente';
  @Input() showSearch: boolean = true;
  @Input() placeholderSearch: string = 'Buscar...';
  @Input() searchValue: string = '';

  @Output() sortChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();

  onSortSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.sortChange.emit(val);
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchChange.emit(val);
  }

  setQuickSort(value: string): void {
    this.sortChange.emit(value);
  }
}
