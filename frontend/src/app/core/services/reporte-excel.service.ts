import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteExcelService {
  private http = inject(HttpClient);
  
  exportando = signal<boolean>(false);
  tablaActual = signal<string | null>(null);

  /**
   * Solicita al servidor el reporte en formato Excel (.xlsx) y dispara la descarga en el navegador.
   * @param tabla Nombre de la tabla/entidad (ej: 'productos', 'categorias', 'clientes', 'ventas', etc.)
   * @param nombreSugerido Nombre sugerido para el archivo guardado en la máquina del usuario
   */
  descargarExcel(tabla: string, nombreSugerido?: string): void {
    this.exportando.set(true);
    this.tablaActual.set(tabla);

    const url = `${environment.apiUrl}/reportes/excel/${tabla}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = nombreSugerido || `Reporte_${tabla}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();

        // Limpieza de memoria DOM
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        this.exportando.set(false);
        this.tablaActual.set(null);
      },
      error: (err) => {
        console.error(`Error al descargar el reporte Excel de ${tabla}:`, err);
        this.exportando.set(false);
        this.tablaActual.set(null);
        alert(`No se pudo descargar el reporte de ${tabla}. Inténtelo de nuevo.`);
      },
    });
  }
}
