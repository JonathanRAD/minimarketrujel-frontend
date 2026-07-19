import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TurnoCajaService } from '../../services/turno-caja.service';
import { TurnoCaja } from '../../../../../core/models/turno-caja.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent, ConfirmModalService } from '@shared/components';

@Component({
  selector: 'app-turno-caja-control-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './turno-caja-control.page.html',
  styleUrl: './turno-caja-control.page.scss'
})
export class TurnoCajaControlPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private turnoCajaService = inject(TurnoCajaService);
  private confirmModal = inject(ConfirmModalService);

  turnoActivo = signal<TurnoCaja | null>(null);
  cargando = signal(true);
  procesando = signal(false);
  errorMessage = signal<string | null>(null);

  usuarioNombre = '';

  aperturaForm = this.fb.nonNullable.group({
    montoInicial: [0, [Validators.required, Validators.min(0)]],
  });

  cierreForm = this.fb.nonNullable.group({
    montoFinalReal: [0, [Validators.required, Validators.min(0)]],
    efectivoReal: [0, [Validators.required, Validators.min(0)]],
    tarjetaReal: [0, [Validators.required, Validators.min(0)]],
    conteoMonedasBilletes: this.fb.group({
      b200: [0, [Validators.min(0)]],
      b100: [0, [Validators.min(0)]],
      b50: [0, [Validators.min(0)]],
      b20: [0, [Validators.min(0)]],
      b10: [0, [Validators.min(0)]],
      m5: [0, [Validators.min(0)]],
      m2: [0, [Validators.min(0)]],
      m1: [0, [Validators.min(0)]],
      m050: [0, [Validators.min(0)]],
      m020: [0, [Validators.min(0)]],
      m010: [0, [Validators.min(0)]],
    })
  });

  // Computeds
  efectivoEsperado = computed(() => {
    const turno = this.turnoActivo();
    if (!turno) return 0;
    return Number(turno.montoInicial || 0) + Number(turno.ventasEfectivo || 0);
  });

  tarjetaEsperada = computed(() => {
    const turno = this.turnoActivo();
    if (!turno) return 0;
    return Number(turno.ventasTarjeta || 0);
  });

  diferenciaEfectivo = computed(() => {
    const real = this.cierreForm.value.efectivoReal || 0;
    return real - this.efectivoEsperado();
  });

  diferenciaTarjeta = computed(() => {
    const real = this.cierreForm.value.tarjetaReal || 0;
    return real - this.tarjetaEsperada();
  });

  diferenciaVivo = computed(() => {
    const esperado = this.turnoActivo()?.montoFinalEsperado || 0;
    const real = this.cierreForm.value.montoFinalReal || 0;
    return real - esperado;
  });

  ngOnInit() {
    const tokenPayload = localStorage.getItem('token') 
      ? JSON.parse(atob(localStorage.getItem('token')!.split('.')[1]))
      : null;
    this.usuarioNombre = tokenPayload?.nombre || 'Cajero';

    this.consultarCaja();

    // Listeners del conteo y cálculo de montos
    this.cierreForm.get('conteoMonedasBilletes')?.valueChanges.subscribe((conteo) => {
      this.recalcularEfectivoDesdeConteo(conteo);
    });

    this.cierreForm.get('efectivoReal')?.valueChanges.subscribe(() => this.recalcularMontoFinalReal());
    this.cierreForm.get('tarjetaReal')?.valueChanges.subscribe(() => this.recalcularMontoFinalReal());
  }

  recalcularEfectivoDesdeConteo(conteo: any) {
    const total = 
      (Number(conteo.b200 || 0) * 200) +
      (Number(conteo.b100 || 0) * 100) +
      (Number(conteo.b50 || 0) * 50) +
      (Number(conteo.b20 || 0) * 20) +
      (Number(conteo.b10 || 0) * 10) +
      (Number(conteo.m5 || 0) * 5) +
      (Number(conteo.m2 || 0) * 2) +
      (Number(conteo.m1 || 0) * 1) +
      (Number(conteo.m050 || 0) * 0.5) +
      (Number(conteo.m020 || 0) * 0.2) +
      (Number(conteo.m010 || 0) * 0.1);

    this.cierreForm.patchValue({
      efectivoReal: Number(total.toFixed(2))
    }, { emitEvent: false });
    
    this.recalcularMontoFinalReal();
  }

  recalcularMontoFinalReal() {
    const ef = Number(this.cierreForm.get('efectivoReal')?.value || 0);
    const tar = Number(this.cierreForm.get('tarjetaReal')?.value || 0);
    this.cierreForm.patchValue({
      montoFinalReal: Number((ef + tar).toFixed(2))
    }, { emitEvent: false });
  }

  consultarCaja() {
    this.cargando.set(true);
    this.errorMessage.set(null);
    this.turnoCajaService.obtenerActivo().subscribe({
      next: (turno) => {
        this.turnoActivo.set(turno);
        if (turno) {
          // Pre-cargar en el cierre los montos esperados
          const efEsperado = Number(turno.montoInicial || 0) + Number(turno.ventasEfectivo || 0);
          const tarEsperado = Number(turno.ventasTarjeta || 0);
          this.cierreForm.patchValue({ 
            efectivoReal: efEsperado,
            tarjetaReal: tarEsperado,
            montoFinalReal: efEsperado + tarEsperado
          });
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMessage.set(err.error?.message || 'Error al obtener el estado de la caja');
      }
    });
  }

  abrirCaja() {
    if (this.aperturaForm.invalid) return;

    this.procesando.set(true);
    this.errorMessage.set(null);

    const values = this.aperturaForm.getRawValue();
    this.turnoCajaService.abrirCaja({ montoInicial: Number(values.montoInicial) }).subscribe({
      next: () => {
        this.procesando.set(false);
        this.consultarCaja();
      },
      error: (err) => {
        this.procesando.set(false);
        this.errorMessage.set(err.error?.message || 'No se pudo abrir la caja');
      }
    });
  }

  async cerrarCaja() {
    if (this.cierreForm.invalid) return;

    const seguro = await this.confirmModal.confirm({
      titulo: '¿Cerrar Turno de Caja?',
      mensaje: '¿Estás seguro de que deseas cerrar la caja y finalizar tu turno?',
      submensaje: 'Esta acción guardará los totales finales y no podrás realizar más operaciones de arqueo sobre este turno.',
      icono: 'lock',
      tipo: 'warning',
      textoConfirmar: 'Sí, cerrar caja',
      textoCancelar: 'Cancelar',
    });
    if (!seguro) return;

    this.procesando.set(true);
    this.errorMessage.set(null);

    const values = this.cierreForm.getRawValue();
    
    // Obtener desglose limpio
    const payload = {
      montoFinalReal: Number(values.montoFinalReal),
      efectivoReal: Number(values.efectivoReal),
      tarjetaReal: Number(values.tarjetaReal),
      conteoMonedasBilletes: values.conteoMonedasBilletes
    };

    this.turnoCajaService.cerrarCaja(payload).subscribe({
      next: () => {
        this.procesando.set(false);
        this.turnoActivo.set(null);
        this.consultarCaja();
      },
      error: (err) => {
        this.procesando.set(false);
        this.errorMessage.set(err.error?.message || 'No se pudo cerrar la caja');
      }
    });
  }
}

