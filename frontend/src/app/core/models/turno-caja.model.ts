export type EstadoTurno = 'ABIERTO' | 'CERRADO';

export interface ConteoMonedasBilletes {
  b200?: number | null;
  b100?: number | null;
  b50?: number | null;
  b20?: number | null;
  b10?: number | null;
  m5?: number | null;
  m2?: number | null;
  m1?: number | null;
  m050?: number | null;
  m020?: number | null;
  m010?: number | null;
}

export interface AuditoriaArqueo {
  efectivoEsperado: number;
  tarjetaEsperada: number;
  efectivoReal: number;
  tarjetaReal: number;
  diferenciaEfectivo: number;
  diferenciaTarjeta: number;
  conteoMonedasBilletes: ConteoMonedasBilletes | null;
}

export interface TurnoCaja {
  id: string;
  usuarioId: string;
  fechaApertura: string;
  fechaCierre?: string | null;
  montoInicial: number;
  montoFinalEsperado?: number | null;
  montoFinalReal?: number | null;
  diferencia?: number | null;
  estado: EstadoTurno;
  auditoriaArqueo?: AuditoriaArqueo | null;
  usuario?: {
    nombre: string;
    email: string;
  };
  // Campos calculados para el turno activo
  ventasEfectivo?: number;
  ventasTarjeta?: number;
}

export interface AperturaTurnoDto {
  montoInicial: number;
}

export interface CierreTurnoDto {
  montoFinalReal: number;
  efectivoReal: number;
  tarjetaReal: number;
  conteoMonedasBilletes?: ConteoMonedasBilletes;
}

export interface PaginatedTurnos {
  turnos: TurnoCaja[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
}
