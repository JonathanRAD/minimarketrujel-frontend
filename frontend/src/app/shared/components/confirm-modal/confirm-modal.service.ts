import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  titulo?: string;
  mensaje: string;
  submensaje?: string;
  icono?: string;
  tipo?: 'danger' | 'warning' | 'info';
  textoConfirmar?: string;
  textoCancelar?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmModalService {
  mostrar = signal<boolean>(false);
  config = signal<ConfirmOptions | null>(null);

  private resolver: ((value: boolean) => void) | null = null;

  /**
   * Muestra un modal de confirmación bonito y retorna una Promesa (true si confirma, false si cancela).
   */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
      this.config.set({
        titulo: options.titulo || '¿Estás seguro?',
        mensaje: options.mensaje,
        submensaje: options.submensaje,
        icono: options.icono || (options.tipo === 'warning' ? 'warning' : options.tipo === 'info' ? 'info' : 'delete_forever'),
        tipo: options.tipo || 'danger',
        textoConfirmar: options.textoConfirmar || 'Sí, confirmar',
        textoCancelar: options.textoCancelar || 'Cancelar',
      });
      this.mostrar.set(true);
    });
  }

  confirmar(): void {
    this.cerrar(true);
  }

  cancelar(): void {
    this.cerrar(false);
  }

  private cerrar(resultado: boolean): void {
    this.mostrar.set(false);
    this.config.set(null);
    if (this.resolver) {
      this.resolver(resultado);
      this.resolver = null;
    }
  }
}
