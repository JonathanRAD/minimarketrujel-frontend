import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="pos-container">
      <!-- Encabezado Táctil y de Alto Contraste -->
      <header class="pos-header">
        <div class="header-left">
          <div class="brand">
            <span class="material-icons pos-icon">point_of_sale</span>
            <span class="pos-title">Caja POS</span>
          </div>

          <!-- Indicador de Conexión (Offline-First) -->
          <div class="connection-status" [class.offline]="!isOnline()">
            <span class="material-icons">
              {{ isOnline() ? 'wifi' : 'wifi_off' }}
            </span>
            <span class="status-text">
              {{ isOnline() ? 'En Línea' : 'Sin Conexión (Offline)' }}
            </span>
          </div>
        </div>

        <div class="header-right">
          <!-- Info de Cajero Activo -->
          <div class="cajero-badge">
            <span class="material-icons">account_circle</span>
            <div class="cajero-info">
              <span class="cajero-name">{{ usuario()?.nombre }}</span>
              <span class="cajero-role">{{ usuario()?.rol }}</span>
            </div>
          </div>

          <!-- Acceso a Administración (Solo administradores) -->
          <a *ngIf="esAdmin()" routerLink="/admin" class="btn-action btn-admin" title="Panel de Administración">
            <span class="material-icons">dashboard</span>
            <span>Administración</span>
          </a>

          <!-- Botón de Cierre de Turno / Salir -->
          <button class="btn-action btn-exit" (click)="salir()" title="Cerrar turno / Salir">
            <span class="material-icons">logout</span>
            <span>Salir</span>
          </button>
        </div>
      </header>

      <!-- Área de Ventas Principal -->
      <main class="pos-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .pos-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: #121212; /* Fondo oscuro táctil de alta visibilidad */
      color: #e0e0e0;
    }

    /* --- HEADER POS --- */
    .pos-header {
      height: 64px;
      background-color: #1e1e1e;
      border-bottom: 2px solid #2d2d2d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      z-index: 10;
    }

    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pos-icon {
      color: var(--color-primary);
      font-size: 2.25rem;
    }

    .pos-title {
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #ffffff;
    }

    /* Indicador Online/Offline */
    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background-color: rgba(16, 185, 129, 0.15); /* verde suave */
      color: #10b981;
      padding: 0.4rem 0.8rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.3);
      transition: all 0.3s ease;
    }

    .connection-status.offline {
      background-color: rgba(239, 68, 68, 0.15); /* rojo suave */
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }

    /* Cajero info */
    .cajero-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #2d2d2d;
      padding: 0.35rem 0.75rem;
      border-radius: var(--border-radius-md);
      border: 1px solid #3d3d3d;
    }

    .cajero-badge span.material-icons {
      font-size: 2rem;
      color: var(--color-text-muted);
    }

    .cajero-info {
      display: flex;
      flex-direction: column;
    }

    .cajero-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #ffffff;
    }

    .cajero-role {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }

    /* Botones de acción táctiles */
    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: var(--pos-button-height); /* 48px mínimo para uso táctil */
      padding: 0 1rem;
      border-radius: var(--border-radius-md);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease-in-out;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .btn-admin {
      background-color: var(--color-secondary);
      color: white;
    }

    .btn-admin:hover {
      background-color: var(--color-secondary-hover);
    }

    .btn-exit {
      background-color: #3a3a3a;
      color: #ff6b6b;
      border: 1px solid #4a4a4a;
    }

    .btn-exit:hover {
      background-color: #ff6b6b;
      color: white;
    }

    /* --- CONTENIDO --- */
    .pos-content {
      flex: 1;
      overflow: hidden;
      background-color: #121212;
    }

    /* responsivo para pantallas pequeñas */
    @media (max-width: 768px) {
      .pos-header {
        height: auto;
        padding: 0.75rem;
        flex-direction: column;
        gap: 0.75rem;
      }
      .header-left, .header-right {
        width: 100%;
        justify-content: space-between;
      }
      .pos-content {
        height: calc(100vh - 120px);
      }
      .btn-action span + span {
        display: none; /* Oculta el texto, deja solo el icono */
      }
      .btn-action {
        width: 48px;
        padding: 0;
      }
    }
  `]
})
export class PosLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  usuario = this.authService.usuario;
  esAdmin = this.authService.esAdmin;
  isOnline = signal(navigator.onLine);

  private onlineHandler = () => this.isOnline.set(true);
  private offlineHandler = () => this.isOnline.set(false);

  ngOnInit() {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  salir() {
    this.authService.logout();
  }
}
