export interface ResumenFinanciero {
  ventasTotales: number;
  costoTotalVentas: number;
  gananciaBruta: number;
  margenPorcentual: number;
  metodosPago: {
    metodo: string;
    total: number;
  }[];
}

export interface TopProductoReporte {
  productoId: string;
  nombre: string;
  codigoBarras: string;
  cantidadVendida: number;
  totalFacturado: number;
}

export interface EstadoFiadosReporte {
  totalDeudaPendiente: number;
  fiadosPendientesConteo: number;
  clientesConDeudaConteo: number;
}

export interface DashboardReporte {
  rangoFechas: {
    inicio: string;
    fin: string;
  };
  resumenFinanciero: ResumenFinanciero;
  topProductos: TopProductoReporte[];
  estadoFiados: EstadoFiadosReporte;
}
