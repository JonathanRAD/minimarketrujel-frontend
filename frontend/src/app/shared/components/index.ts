/**
 * Barrel export de todos los componentes compartidos.
 * Uso: import { SpinnerComponent, ErrorAlertComponent } from '@shared/components';
 * (requiere configurar el path alias @shared en tsconfig.json)
 * 
 * O directamente:
 * import { SpinnerComponent } from '../../../shared/components';
 */
export { SpinnerComponent } from './spinner/spinner.component';
export { ErrorAlertComponent } from './error-alert/error-alert.component';
export { EmptyStateComponent } from './empty-state/empty-state.component';
export { PageHeaderComponent } from './page-header/page-header.component';
export { StatusBadgeComponent, BadgeVariant } from './status-badge/status-badge.component';
export { BuscadorProductoComponent } from './buscador-producto/buscador-producto.component';
export { PaginationComponent } from './pagination/pagination.component';
export { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
export { ConfirmModalService, ConfirmOptions } from './confirm-modal/confirm-modal.service';
