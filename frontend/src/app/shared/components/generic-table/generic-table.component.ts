import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  TemplateRef,
  ContentChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'custom';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  badgeMap?: { [key: string]: { label: string; class: string } };
  cellFn?: (row: T) => any;
}

export interface TableAction<T = any> {
  icon: string;
  label: string;
  color?: 'primary' | 'accent' | 'warn' | 'default';
  action: (row: T) => void;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
})
export class GenericTableComponent<T = any> implements OnInit, OnChanges, AfterViewInit {
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() displayedColumns: string[] = [];

  // Opciones de configuración
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Buscar en la tabla...';
  @Input() showPaginator: boolean = true;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() pageSize: number = 10;
  @Input() loading: boolean = false;
  // Acciones por fila (Editar, Eliminar, Activar/Desactivar, etc.)
  @Input() showActions: boolean = false;
  @Input() showToggleStatus: boolean = false;
  @Input() actionsHeader: string = 'Acciones';

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() toggleStatus = new EventEmitter<T>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() search = new EventEmitter<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<T>([]);
  searchValue: string = '';

  get allDisplayedColumns(): string[] {
    if (this.displayedColumns && this.displayedColumns.length > 0) {
      return this.showActions ? [...this.displayedColumns, 'actions'] : this.displayedColumns;
    }
    const cols = this.columns.map((c) => c.key);
    return this.showActions ? [...cols, 'actions'] : cols;
  }

  ngOnInit(): void {
    this.setupDataSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.dataSource) {
      this.dataSource.data = this.data || [];
    }
  }

  ngAfterViewInit(): void {
    if (this.showPaginator && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  private removeAccents(str: string): string {
    return str
      ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      : '';
  }

  private setupDataSource(): void {
    this.dataSource.data = this.data || [];

    // Personalización del algoritmo de búsqueda para búsquedas multi-término e insensibles a tildes
    this.dataSource.filterPredicate = (record: T, filter: string): boolean => {
      if (!filter) return true;
      const normalizedQuery = this.removeAccents(filter.trim());
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      if (terms.length === 0) return true;

      const recordValues = this.extractSearchableString(record);
      const normalizedRecord = this.removeAccents(recordValues);

      return terms.every((term) => normalizedRecord.includes(term));
    };
  }

  private extractSearchableString(record: any): string {
    if (!record) return '';
    const parts: string[] = [];
    
    for (const key of Object.keys(record)) {
      const val = record[key];
      if (val !== null && val !== undefined) {
        if (typeof val === 'object') {
          if (val.nombre) parts.push(String(val.nombre));
          if (val.descripcion) parts.push(String(val.descripcion));
        } else {
          parts.push(String(val));
        }
      }
    }
    return parts.join(' ');
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchValue = filterValue;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.search.emit(filterValue);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch(): void {
    this.searchValue = '';
    this.dataSource.filter = '';
    this.search.emit('');
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getCellValue(row: T, col: TableColumn<T>): any {
    if (col.cellFn) {
      return col.cellFn(row);
    }
    // Soporte para propiedades anidadas como 'categoria.nombre'
    const keys = col.key.split('.');
    let val: any = row;
    for (const k of keys) {
      if (val === null || val === undefined) return '';
      val = val[k];
    }
    return val;
  }

  onEditRow(row: T, event: MouseEvent): void {
    event.stopPropagation();
    this.edit.emit(row);
  }

  onDeleteRow(row: T, event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit(row);
  }

  onToggleStatusRow(row: T, event: MouseEvent): void {
    event.stopPropagation();
    this.toggleStatus.emit(row);
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
}
