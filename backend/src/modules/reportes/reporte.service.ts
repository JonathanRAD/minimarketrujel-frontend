import { Response } from 'express';
import { prisma } from '../../config/prisma';
import { excelService } from '../../common/services/excel.service';
import { reporteRepository } from './reporte.repository';
import { parseFechaInicio, parseFechaFin } from '../../common/utils/date.utils';

export class ReporteService {
  async obtenerDashboard(fechaInicioStr?: string, fechaFinStr?: string) {
    const inicio = parseFechaInicio(fechaInicioStr);
    const fin = parseFechaFin(fechaFinStr);

    const [resumenFinanciero, topProductos, estadoFiados] = await Promise.all([
      reporteRepository.obtenerResumenFinanciero(inicio, fin),
      reporteRepository.obtenerTopProductos(inicio, fin),
      reporteRepository.obtenerEstadoFiados(),
    ]);

    const margenPorcentual = resumenFinanciero.ventasTotales > 0
      ? (resumenFinanciero.gananciaBruta / resumenFinanciero.ventasTotales) * 100
      : 0;

    return {
      rangoFechas: {
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      },
      resumenFinanciero: {
        ...resumenFinanciero,
        margenPorcentual,
      },
      topProductos,
      estadoFiados,
    };
  }

  // ============================================================
  // EXPORTACIÓN DE REPORTES EN EXCEL
  // ============================================================

  /** Reporte Excel de Catálogo y Plantilla de Compras de Productos */
  async exportarProductosExcel(res: Response): Promise<void> {
    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: [
        { categoria: { nombre: 'asc' } },
        { nombre: 'asc' },
      ],
    });

    const datosFormateados = productos.map((p, idx) => {
      const precioVenta = Number(p.precioVenta);
      const costo = Number(p.costo);
      const stockActual = Number(p.stockActual);

      return {
        correlativo: idx + 1,
        codigoBarras: p.codigoBarras && !p.codigoBarras.startsWith('SC-') ? p.codigoBarras : '',
        categoria: p.categoria?.nombre || 'ABARROTES',
        nombre: p.nombre,
        stockActual,
        unidadMedida: p.unidadMedida || 'UNID.',
        costo,
        precioVenta,
        fechaRegistro: p.createdAt,
        tienda: '',
      };
    });

    await excelService.generarYEnviarReporte(res, {
      titulo: 'Catálogo de Inventario y Pedidos de Productos',
      subtitulo: 'Plantilla compatible para registro de compras, actualización de costos y carga de inventario',
      nombreHoja: 'base de pedidos',
      nombreArchivo: `Plantilla_Productos_Pedidos_${Date.now()}.xlsx`,
      mostrarTotales: true,
      columnas: [
        { header: 'ID', key: 'correlativo', width: 8, tipo: 'entero', alineacion: 'center' },
        { header: 'COD. DE BARRAS', key: 'codigoBarras', width: 18, tipo: 'texto', alineacion: 'center' },
        { header: 'CATEGORÍA', key: 'categoria', width: 20, tipo: 'texto' },
        { header: 'PRODUCTO', key: 'nombre', width: 40, tipo: 'texto' },
        { header: 'CANT.', key: 'stockActual', width: 12, tipo: 'cantidad', esTotalizable: true },
        { header: 'UNID. MEDIDA', key: 'unidadMedida', width: 15, tipo: 'texto', alineacion: 'center' },
        { header: 'PRECIO UNITARIO', key: 'costo', width: 18, tipo: 'moneda' },
        { header: 'PRECIO VENTA', key: 'precioVenta', width: 16, tipo: 'moneda' },
        { header: 'FECHA DE REGISTRO', key: 'fechaRegistro', width: 18, tipo: 'fecha' },
        { header: 'TIENDA', key: 'tienda', width: 25, tipo: 'texto' },
      ],
      datos: datosFormateados,
    });
  }

  /** Reporte Excel de Categorías */
  async exportarCategoriasExcel(res: Response): Promise<void> {
    const categorias = await prisma.categoria.findMany({
      include: {
        _count: {
          select: { productos: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const datosFormateados = categorias.map((c) => ({
      nombre: c.nombre,
      descripcion: c.descripcion || 'Sin descripción',
      totalProductos: c._count.productos,
      estado: c.activo ? 'ACTIVO' : 'INACTIVO',
      createdAt: c.createdAt,
    }));

    await excelService.generarYEnviarReporte(res, {
      titulo: 'Categorías de Productos',
      subtitulo: 'Resumen de categorías registradas y cantidad de productos',
      nombreHoja: 'Categorías',
      nombreArchivo: `Reporte_Categorias_${Date.now()}.xlsx`,
      mostrarTotales: true,
      columnas: [
        { header: 'Nombre Categoría', key: 'nombre', width: 25, tipo: 'texto' },
        { header: 'Descripción', key: 'descripcion', width: 35, tipo: 'texto' },
        { header: 'Total Productos', key: 'totalProductos', width: 16, tipo: 'entero', esTotalizable: true },
        { header: 'Estado', key: 'estado', width: 12, tipo: 'estado' },
        { header: 'Fecha Creación', key: 'createdAt', width: 18, tipo: 'fecha' },
      ],
      datos: datosFormateados,
    });
  }

  /** Reporte Excel de Clientes */
  async exportarClientesExcel(res: Response): Promise<void> {
    const clientes = await prisma.cliente.findMany({
      include: {
        fiados: {
          where: { pagado: false },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const datosFormateados = clientes.map((c) => {
      const deudaTotal = c.fiados.reduce((acc, f) => acc + Number(f.monto), 0);
      return {
        nombre: c.nombre,
        telefono: c.telefono || 'N/A',
        direccion: c.direccion || 'N/A',
        limiteCredito: Number(c.limiteCredito),
        deudaActual: deudaTotal,
        estado: c.activo ? 'ACTIVO' : 'INACTIVO',
        createdAt: c.createdAt,
      };
    });

    await excelService.generarYEnviarReporte(res, {
      titulo: 'Directorio de Clientes y Créditos',
      subtitulo: 'Lista de clientes con sus límites de crédito y saldo fiado adeudado',
      nombreHoja: 'Clientes',
      nombreArchivo: `Reporte_Clientes_${Date.now()}.xlsx`,
      mostrarTotales: true,
      columnas: [
        { header: 'Nombre del Cliente', key: 'nombre', width: 28, tipo: 'texto' },
        { header: 'Teléfono', key: 'telefono', width: 16, tipo: 'texto', alineacion: 'center' },
        { header: 'Dirección', key: 'direccion', width: 30, tipo: 'texto' },
        { header: 'Límite Crédito', key: 'limiteCredito', width: 16, tipo: 'moneda', esTotalizable: true },
        { header: 'Deuda Pendiente', key: 'deudaActual', width: 16, tipo: 'moneda', esTotalizable: true },
        { header: 'Estado', key: 'estado', width: 12, tipo: 'estado' },
        { header: 'Fecha Registro', key: 'createdAt', width: 18, tipo: 'fecha' },
      ],
      datos: datosFormateados,
    });
  }

  /** Reporte Excel de Proveedores */
  async exportarProveedoresExcel(res: Response): Promise<void> {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' },
    });

    const datosFormateados = proveedores.map((p) => ({
      nombre: p.nombre,
      contacto: p.contacto || 'N/A',
      telefono: p.telefono || 'N/A',
      email: p.email || 'N/A',
      direccion: p.direccion || 'N/A',
      estado: p.activo ? 'ACTIVO' : 'INACTIVO',
      createdAt: p.createdAt,
    }));

    await excelService.generarYEnviarReporte(res, {
      titulo: 'Directorio de Proveedores',
      subtitulo: 'Información de contacto de proveedores registrados',
      nombreHoja: 'Proveedores',
      nombreArchivo: `Reporte_Proveedores_${Date.now()}.xlsx`,
      columnas: [
        { header: 'Razón Social / Nombre', key: 'nombre', width: 30, tipo: 'texto' },
        { header: 'Contacto', key: 'contacto', width: 22, tipo: 'texto' },
        { header: 'Teléfono', key: 'telefono', width: 16, tipo: 'texto', alineacion: 'center' },
        { header: 'Email', key: 'email', width: 25, tipo: 'texto' },
        { header: 'Dirección', key: 'direccion', width: 30, tipo: 'texto' },
        { header: 'Estado', key: 'estado', width: 12, tipo: 'estado' },
        { header: 'Fecha Registro', key: 'createdAt', width: 18, tipo: 'fecha' },
      ],
      datos: datosFormateados,
    });
  }

  /** Reporte Excel de Ventas con Múltiples Hojas (Resumen + Detalle de Productos) */
  async exportarVentasExcel(res: Response): Promise<void> {
    const ventas = await prisma.venta.findMany({
      include: {
        usuario: true,
        cliente: true,
        detalles: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
          },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 2000,
    });

    // 1. Datos para Hoja 1: Resumen de Ventas
    const datosResumen = ventas.map((v) => ({
      codigo: v.id.substring(0, 8).toUpperCase(),
      fecha: v.fecha,
      cajero: v.usuario?.nombre || 'N/A',
      cliente: v.cliente?.nombre || 'Público General',
      metodoPago: v.metodoPago,
      total: Number(v.total),
      estado: v.estado,
    }));

    // 2. Datos para Hoja 2: Detalle de Productos Vendidos
    const datosDetalle: any[] = [];
    for (const v of ventas) {
      const codigoVenta = v.id.substring(0, 8).toUpperCase();
      const totalVenta = Number(v.total);
      for (const d of v.detalles) {
        datosDetalle.push({
          codigoVenta,
          fecha: v.fecha,
          codigoBarras: d.producto?.codigoBarras || 'N/A',
          producto: d.producto?.nombre || 'Producto no identificado',
          categoria: d.producto?.categoria?.nombre || 'GENERAL',
          cantidad: Number(d.cantidad),
          precioUnitario: Number(d.precioUnitario),
          subtotal: Number(d.subtotal),
          totalVenta,
          metodoPago: v.metodoPago,
          cajero: v.usuario?.nombre || 'N/A',
        });
      }
    }

    await excelService.generarYEnviarReporteMultiHojas(res, {
      nombreArchivo: `Reporte_Ventas_${Date.now()}.xlsx`,
      hojas: [
        {
          nombreHoja: 'Resumen de Ventas',
          titulo: 'Historial General de Ventas',
          subtitulo: 'Consolidado de transacciones realizadas en el sistema POS',
          mostrarTotales: true,
          columnas: [
            { header: 'ID Venta', key: 'codigo', width: 14, tipo: 'texto', alineacion: 'center' },
            { header: 'Fecha y Hora', key: 'fecha', width: 18, tipo: 'fecha' },
            { header: 'Cajero / Usuario', key: 'cajero', width: 22, tipo: 'texto' },
            { header: 'Cliente', key: 'cliente', width: 25, tipo: 'texto' },
            { header: 'Método Pago', key: 'metodoPago', width: 16, tipo: 'texto', alineacion: 'center' },
            { header: 'Total Venta', key: 'total', width: 16, tipo: 'moneda', esTotalizable: true },
            { header: 'Estado', key: 'estado', width: 14, tipo: 'estado' },
          ],
          datos: datosResumen,
        },
        {
          nombreHoja: 'Detalle de Productos',
          titulo: 'Detalle de Productos Vendidos',
          subtitulo: 'Desglose por producto vendido, cantidades, precios y subtotales por venta',
          mostrarTotales: true,
          columnaAgrupacion: 'codigoVenta',
          columnasACombinar: ['codigoVenta', 'fecha', 'totalVenta', 'metodoPago', 'cajero'],
          columnas: [
            { header: 'ID Venta', key: 'codigoVenta', width: 14, tipo: 'texto', alineacion: 'center' },
            { header: 'Fecha y Hora', key: 'fecha', width: 18, tipo: 'fecha' },
            { header: 'Cód. Barras', key: 'codigoBarras', width: 16, tipo: 'texto', alineacion: 'center' },
            { header: 'Producto', key: 'producto', width: 35, tipo: 'texto' },
            { header: 'Categoría', key: 'categoria', width: 20, tipo: 'texto' },
            { header: 'Cant.', key: 'cantidad', width: 10, tipo: 'cantidad', esTotalizable: true },
            { header: 'P. Unitario', key: 'precioUnitario', width: 14, tipo: 'moneda' },
            { header: 'Subtotal Ítem', key: 'subtotal', width: 16, tipo: 'moneda', esTotalizable: true },
            { header: 'Total Venta', key: 'totalVenta', width: 16, tipo: 'moneda', alineacion: 'right' },
            { header: 'Método Pago', key: 'metodoPago', width: 15, tipo: 'texto', alineacion: 'center' },
            { header: 'Cajero', key: 'cajero', width: 20, tipo: 'texto' },
          ],
          datos: datosDetalle,
        },
      ],
    });
  }

  /** Reporte Excel de Compras */
  async exportarComprasExcel(res: Response): Promise<void> {
    const compras = await prisma.compra.findMany({
      include: {
        proveedor: true,
        usuario: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    const datosResumen = compras.map((c) => ({
      codigo: c.id.substring(0, 8).toUpperCase(),
      fecha: c.fecha,
      proveedor: c.proveedor?.nombre || 'N/A',
      usuario: c.usuario?.nombre || 'N/A',
      total: Number(c.total),
      estado: c.estado,
    }));

    const datosDetalle: any[] = [];
    for (const c of compras) {
      const codigoCompra = c.id.substring(0, 8).toUpperCase();
      const totalCompra = Number(c.total);
      for (const d of c.detalles) {
        datosDetalle.push({
          codigoCompra,
          fecha: c.fecha,
          proveedor: c.proveedor?.nombre || 'N/A',
          codigoBarras: d.producto?.codigoBarras || 'N/A',
          producto: d.producto?.nombre || 'Producto no identificado',
          cantidad: Number(d.cantidad),
          costoUnitario: Number(d.costoUnitario),
          subtotal: Number(d.subtotal),
          totalCompra,
        });
      }
    }

    await excelService.generarYEnviarReporteMultiHojas(res, {
      nombreArchivo: `Reporte_Compras_${Date.now()}.xlsx`,
      hojas: [
        {
          nombreHoja: 'Resumen de Compras',
          titulo: 'Historial de Compras y Reabastecimiento',
          subtitulo: 'Órdenes de compra registradas con proveedores',
          mostrarTotales: true,
          columnas: [
            { header: 'ID Compra', key: 'codigo', width: 14, tipo: 'texto', alineacion: 'center' },
            { header: 'Fecha Registro', key: 'fecha', width: 18, tipo: 'fecha' },
            { header: 'Proveedor', key: 'proveedor', width: 28, tipo: 'texto' },
            { header: 'Registrado Por', key: 'usuario', width: 22, tipo: 'texto' },
            { header: 'Total Compra', key: 'total', width: 16, tipo: 'moneda', esTotalizable: true },
            { header: 'Estado', key: 'estado', width: 14, tipo: 'estado' },
          ],
          datos: datosResumen,
        },
        {
          nombreHoja: 'Detalle de Productos',
          titulo: 'Detalle de Productos Comprados',
          subtitulo: 'Desglose por producto adquirido, cantidades y costos unitarios',
          mostrarTotales: true,
          columnaAgrupacion: 'codigoCompra',
          columnasACombinar: ['codigoCompra', 'fecha', 'proveedor', 'totalCompra'],
          columnas: [
            { header: 'ID Compra', key: 'codigoCompra', width: 14, tipo: 'texto', alineacion: 'center' },
            { header: 'Fecha', key: 'fecha', width: 18, tipo: 'fecha' },
            { header: 'Proveedor', key: 'proveedor', width: 25, tipo: 'texto' },
            { header: 'Cód. Barras', key: 'codigoBarras', width: 16, tipo: 'texto', alineacion: 'center' },
            { header: 'Producto', key: 'producto', width: 35, tipo: 'texto' },
            { header: 'Cant.', key: 'cantidad', width: 10, tipo: 'cantidad', esTotalizable: true },
            { header: 'Costo Unit.', key: 'costoUnitario', width: 14, tipo: 'moneda' },
            { header: 'Subtotal Ítem', key: 'subtotal', width: 16, tipo: 'moneda', esTotalizable: true },
            { header: 'Total Factura', key: 'totalCompra', width: 16, tipo: 'moneda', alineacion: 'right' },
          ],
          datos: datosDetalle,
        },
      ],
    });
  }

  /** Reporte Excel de Movimientos de Inventario */
  async exportarInventarioExcel(res: Response): Promise<void> {
    const movimientos = await prisma.movimientoInventario.findMany({
      include: {
        producto: true,
        usuario: true,
      },
      orderBy: { fecha: 'desc' },
      take: 1000,
    });

    const datosFormateados = movimientos.map((m) => ({
      fecha: m.fecha,
      producto: m.producto?.nombre || 'N/A',
      codigoBarras: m.producto?.codigoBarras || 'N/A',
      tipo: m.tipo,
      cantidad: Number(m.cantidad),
      motivo: m.motivo || 'N/A',
      usuario: m.usuario?.nombre || 'N/A',
    }));

    await excelService.generarYEnviarReporte(res, {
      titulo: 'Kardex / Movimientos de Inventario',
      subtitulo: 'Kardex de entradas, salidas, mermas y ajustes de stock',
      nombreHoja: 'Kardex Inventario',
      nombreArchivo: `Reporte_Inventario_${Date.now()}.xlsx`,
      mostrarTotales: true,
      columnas: [
        { header: 'Fecha Movimiento', key: 'fecha', width: 18, tipo: 'fecha' },
        { header: 'Código Producto', key: 'codigoBarras', width: 18, tipo: 'texto', alineacion: 'center' },
        { header: 'Producto', key: 'producto', width: 28, tipo: 'texto' },
        { header: 'Tipo Movimiento', key: 'tipo', width: 18, tipo: 'texto', alineacion: 'center' },
        { header: 'Cantidad Delta', key: 'cantidad', width: 16, tipo: 'cantidad', esTotalizable: true },
        { header: 'Motivo / Detalle', key: 'motivo', width: 30, tipo: 'texto' },
        { header: 'Responsable', key: 'usuario', width: 22, tipo: 'texto' },
      ],
      datos: datosFormateados,
    });
  }

  /** Reporte Excel de Turnos de Caja */
  async exportarTurnosCajaExcel(res: Response): Promise<void> {
    const turnos = await prisma.turnoCaja.findMany({
      include: {
        usuario: true,
      },
      orderBy: { fechaApertura: 'desc' },
    });

    const datosFormateados = turnos.map((t) => ({
      cajero: t.usuario?.nombre || 'N/A',
      fechaApertura: t.fechaApertura,
      fechaCierre: t.fechaCierre,
      montoInicial: Number(t.montoInicial),
      montoEsperado: t.montoFinalEsperado !== null ? Number(t.montoFinalEsperado) : 0,
      montoReal: t.montoFinalReal !== null ? Number(t.montoFinalReal) : 0,
      diferencia: t.diferencia !== null ? Number(t.diferencia) : 0,
      estado: t.estado,
    }));

    await excelService.generarYEnviarReporte(res, {
      titulo: 'Historial de Turnos de Caja (Arqueos)',
      subtitulo: 'Aperturas, cierres de caja y diferencias de arqueo',
      nombreHoja: 'Turnos de Caja',
      nombreArchivo: `Reporte_TurnosCaja_${Date.now()}.xlsx`,
      mostrarTotales: true,
      columnas: [
        { header: 'Cajero Responsable', key: 'cajero', width: 24, tipo: 'texto' },
        { header: 'Apertura', key: 'fechaApertura', width: 18, tipo: 'fecha' },
        { header: 'Cierre', key: 'fechaCierre', width: 18, tipo: 'fecha' },
        { header: 'Monto Inicial', key: 'montoInicial', width: 15, tipo: 'moneda' },
        { header: 'Monto Esperado', key: 'montoEsperado', width: 16, tipo: 'moneda', esTotalizable: true },
        { header: 'Monto Real Contado', key: 'montoReal', width: 18, tipo: 'moneda', esTotalizable: true },
        { header: 'Diferencia (Cuadre)', key: 'diferencia', width: 18, tipo: 'moneda', esTotalizable: true },
        { header: 'Estado', key: 'estado', width: 12, tipo: 'estado' },
      ],
      datos: datosFormateados,
    });
  }
}

export const reporteService = new ReporteService();
