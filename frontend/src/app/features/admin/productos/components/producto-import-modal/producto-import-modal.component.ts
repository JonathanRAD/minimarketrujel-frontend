import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  ProductoService,
  ResumenImportacionExcel,
  ResumenPreAnalisisExcel,
  ItemPreAnalisisExcel,
} from '../../services/producto.service';
import { ErrorAlertComponent, SpinnerComponent } from '@shared/components';

@Component({
  selector: 'app-producto-import-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ErrorAlertComponent,
    SpinnerComponent,
  ],
  templateUrl: './producto-import-modal.component.html',
  styleUrl: './producto-import-modal.component.scss',
})
export class ProductoImportModalComponent {
  private productoService = inject(ProductoService);
  public dialogRef = inject(MatDialogRef<ProductoImportModalComponent>);

  modoImportacion = signal<'REEMPLAZAR' | 'SUMAR'>('REEMPLAZAR');
  usarFechaCorte = signal<boolean>(true);
  fechaCorte = signal<string>('2026-08-08');

  archivoSeleccionado = signal<File | null>(null);
  archivoBase64 = signal<string | null>(null);

  analizando = signal(false);
  procesando = signal(false);
  error = signal<string | null>(null);

  preAnalisis = signal<ResumenPreAnalisisExcel | null>(null);
  pestanaActiva = signal<'NUEVO' | 'ACTUALIZAR'>('NUEVO');

  // Mapa de anulaciones personalizadas por el usuario: fila -> 'NUEVO' | 'ACTUALIZAR' o { accion, productoId }
  overrideAcciones = signal<{
    [fila: number]: 'NUEVO' | 'ACTUALIZAR' | { accion: 'NUEVO' | 'ACTUALIZAR'; productoId?: string };
  }>({});

  // Mapa de coincidencias asignadas manualmente o sobrescritas
  overrideCoincidencias = signal<{ [fila: number]: ItemPreAnalisisExcel['coincidenciaDb'] }>({});

  // Estado del selector / modal de vinculación manual
  itemParaVincular = signal<ItemPreAnalisisExcel | null>(null);
  busquedaCatalogo = signal<string>('');
  resultadosBusqueda = signal<any[]>([]);
  buscandoProductos = signal<boolean>(false);

  resumenFinal = signal<ResumenImportacionExcel | null>(null);
  isDragging = signal(false);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.validarYAsignarArchivo(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.validarYAsignarArchivo(file);
    }
  }

  private validarYAsignarArchivo(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      this.error.set('Solo se permiten archivos de Excel (.xlsx, .xls) o CSV.');
      return;
    }
    this.error.set(null);
    this.preAnalisis.set(null);
    this.resumenFinal.set(null);
    this.archivoSeleccionado.set(file);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.archivoBase64.set(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  quitarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.archivoBase64.set(null);
    this.preAnalisis.set(null);
    this.resumenFinal.set(null);
    this.error.set(null);
    this.overrideAcciones.set({});
    this.overrideCoincidencias.set({});
    this.cerrarBuscadorVinculacion();
  }

  onFechaCorteChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      this.fechaCorte.set(val);
      if (this.archivoBase64()) {
        this.ejecutarPreAnalisis();
      }
    }
  }

  toggleUsarFechaCorte(): void {
    this.usarFechaCorte.set(!this.usarFechaCorte());
    if (this.archivoBase64()) {
      this.ejecutarPreAnalisis();
    }
  }

  ejecutarPreAnalisis(): void {
    const base64 = this.archivoBase64();
    if (!base64) return;

    this.analizando.set(true);
    this.error.set(null);
    const fCorte = this.usarFechaCorte() ? this.fechaCorte() : undefined;

    this.productoService.preanalizarExcel(base64, fCorte).subscribe({
      next: (res) => {
        this.analizando.set(false);
        this.preAnalisis.set(res);
        this.overrideAcciones.set({});
        this.overrideCoincidencias.set({});

        // Seleccionar automáticamente la pestaña con contenido
        if (res.totalNuevos > 0) this.pestanaActiva.set('NUEVO');
        else this.pestanaActiva.set('ACTUALIZAR');
      },
      error: (err) => {
        this.analizando.set(false);
        this.error.set(err.error?.message || 'Error al analizar el archivo Excel.');
      },
    });
  }

  /** Permite al usuario cambiar la acción asignada a una fila en la vista previa */
  toggleAccionItem(item: ItemPreAnalisisExcel): void {
    const actual = this.getAccionEfectiva(item);
    if (actual === 'ACTUALIZAR') {
      this.desvincularItem(item);
    } else {
      this.abrirBuscadorVinculacion(item);
    }
  }

  /** Vincula directamente un ítem con una sugerencia automática en 1 solo clic */
  vincularConSugerencia(
    item: ItemPreAnalisisExcel,
    sug: { id: string; nombre: string; codigoBarras?: string; stockActual: number; puntaje: number }
  ): void {
    this.overrideAcciones.update((mapa) => ({
      ...mapa,
      [item.fila]: { accion: 'ACTUALIZAR', productoId: sug.id },
    }));
    this.overrideCoincidencias.update((mapa) => ({
      ...mapa,
      [item.fila]: {
        id: sug.id,
        nombre: sug.nombre,
        codigoBarras: sug.codigoBarras,
        stockActual: sug.stockActual,
        puntaje: sug.puntaje,
      },
    }));
  }

  /** Desvincula un producto y lo vuelve a clasificar como Nuevo */
  desvincularItem(item: ItemPreAnalisisExcel): void {
    this.overrideAcciones.update((mapa) => ({
      ...mapa,
      [item.fila]: 'NUEVO',
    }));
    this.overrideCoincidencias.update((mapa) => {
      const copia = { ...mapa };
      delete copia[item.fila];
      return copia;
    });
  }

  /** Abre el buscador manual de productos para vincular la fila */
  abrirBuscadorVinculacion(item: ItemPreAnalisisExcel): void {
    this.itemParaVincular.set(item);

    // Extraer una palabra clave inicial para ayudar al usuario
    const palabras = item.nombreExcel
      .replace(/(BEBIDA|ENERGIZANTE|GASEOSA|PRODUCTO|DE|CON|EL|LA|EN|UN|UNA|DEL|LOS|LAS)\b/gi, '')
      .trim()
      .split(/\s+/)
      .filter((p) => p.length >= 3);

    const queryInicial = palabras[0] || '';
    this.busquedaCatalogo.set(queryInicial);
    this.ejecutarBusquedaCatalogo(queryInicial);
  }

  cerrarBuscadorVinculacion(): void {
    this.itemParaVincular.set(null);
    this.busquedaCatalogo.set('');
    this.resultadosBusqueda.set([]);
    this.buscandoProductos.set(false);
  }

  onInputBusquedaChange(): void {
    this.ejecutarBusquedaCatalogo(this.busquedaCatalogo());
  }

  ejecutarBusquedaCatalogo(query: string): void {
    const q = query.trim();
    this.buscandoProductos.set(true);

    this.productoService.listar({ busqueda: q || undefined, limite: 10, todo: false }).subscribe({
      next: (res) => {
        this.resultadosBusqueda.set(res.productos || []);
        this.buscandoProductos.set(false);
      },
      error: () => {
        this.resultadosBusqueda.set([]);
        this.buscandoProductos.set(false);
      },
    });
  }

  seleccionarProductoCatalogo(producto: any): void {
    const item = this.itemParaVincular();
    if (!item) return;

    this.overrideAcciones.update((mapa) => ({
      ...mapa,
      [item.fila]: { accion: 'ACTUALIZAR', productoId: producto.id },
    }));
    this.overrideCoincidencias.update((mapa) => ({
      ...mapa,
      [item.fila]: {
        id: producto.id,
        nombre: producto.nombre,
        codigoBarras: producto.codigoBarras,
        stockActual: Number(producto.stockActual) || 0,
        puntaje: 1.0,
      },
    }));

    this.cerrarBuscadorVinculacion();
  }

  getAccionEfectiva(item: ItemPreAnalisisExcel): 'NUEVO' | 'ACTUALIZAR' {
    const ov = this.overrideAcciones()[item.fila];
    if (!ov) return item.tipoAccion;
    if (typeof ov === 'string') return ov;
    return ov.accion;
  }

  getCoincidenciaEfectiva(item: ItemPreAnalisisExcel): ItemPreAnalisisExcel['coincidenciaDb'] {
    return this.overrideCoincidencias()[item.fila] || item.coincidenciaDb;
  }

  esVinculadoManualmente(item: ItemPreAnalisisExcel): boolean {
    return !!this.overrideCoincidencias()[item.fila];
  }

  getItemsFiltrados(tipo: 'NUEVO' | 'ACTUALIZAR'): ItemPreAnalisisExcel[] {
    const res = this.preAnalisis();
    if (!res) return [];
    return res.items.filter((item) => this.getAccionEfectiva(item) === tipo);
  }

  getConteoEfectivo(tipo: 'NUEVO' | 'ACTUALIZAR'): number {
    return this.getItemsFiltrados(tipo).length;
  }

  confirmarImportacion(): void {
    const base64 = this.archivoBase64();
    if (!base64) return;

    this.procesando.set(true);
    this.error.set(null);

    const fCorte = this.usarFechaCorte() ? this.fechaCorte() : undefined;

    this.productoService
      .importarExcel(base64, this.modoImportacion(), fCorte, this.overrideAcciones())
      .subscribe({
        next: (res) => {
          this.procesando.set(false);
          this.resumenFinal.set(res);
        },
        error: (err) => {
          this.procesando.set(false);
          this.error.set(err.error?.message || 'Error al ejecutar la importación.');
        },
      });
  }

  cerrar(guardado: boolean = false): void {
    this.dialogRef.close(guardado);
  }
}
