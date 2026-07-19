import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScannerInputComponent } from '../../components/scanner-input/scanner-input.component';
import { CarritoService } from '../../services/carrito.service';
import { VentaService } from '../../services/venta.service';
import { ProductoService } from '../../../../admin/productos/services/producto.service';
import { CategoriaService } from '../../../../admin/categorias/services/categoria.service';
import { TurnoCajaService } from '../../../../admin/turnos-caja/services/turno-caja.service';
import { ClienteService } from '../../../../admin/clientes/services/cliente.service';
import { LocalDbService } from '../../../offline/local-db.service';
import { MetodoPago } from '../../../../../core/models/venta.model';
import { Producto } from '../../../../../core/models/producto.model';
import { SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent } from '@shared/components';

@Component({
  selector: 'app-venta-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ScannerInputComponent, SpinnerComponent, ErrorAlertComponent, EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './venta.page.html',
  styleUrl: './venta.page.scss',
})
export class VentaPageComponent implements OnInit, OnDestroy {
  private carritoService = inject(CarritoService);
  private ventaService = inject(VentaService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private turnoCajaService = inject(TurnoCajaService);
  private clienteService = inject(ClienteService);
  private localDb = inject(LocalDbService);

  private syncIntervalId: any;

  items = this.carritoService.items;
  total = this.carritoService.total;
  cantidadTotal = this.carritoService.cantidadTotal;

  cargando = signal(false);
  mensajeError = signal<string | null>(null);
  procesandoCobro = signal(false);

  // Turno de Caja
  cargandoTurno = signal(true);
  turnoActivo = signal<any | null>(null);

  // Vista activa para móvil (Pestañas)
  vistaActiva = signal<'CATALOGO' | 'CARRITO'>('CATALOGO');

  // Clientes
  clientes = signal<any[]>([]);
  clienteSeleccionado = signal<any | null>(null);
  busquedaCliente = signal<string>('');

  // Contador de Ventas Pendientes de Sincronizar
  ventasPendientesConteo = signal<number>(0);

  clientesFiltrados = computed(() => {
    const query = this.busquedaCliente().toLowerCase().trim();
    const list = this.clientes();
    if (!query) return [];
    return list.filter((c) => 
      c.nombre.toLowerCase().includes(query) || 
      (c.telefono && c.telefono.includes(query)) ||
      (c.dniRuc && c.dniRuc.includes(query))
    );
  });

  // Catálogo Visual
  categorias = signal<any[]>([]);
  productos = signal<Producto[]>([]);
  categoriaSeleccionadaId = signal<string>('TODAS');
  busquedaCatalogo = signal<string>('');

  catalogoFiltrado = computed(() => {
    const catId = this.categoriaSeleccionadaId();
    const query = this.busquedaCatalogo().toLowerCase().trim();
    const prods = this.productos();

    return prods.filter((p) => {
      const matchesCat = catId === 'TODAS' || p.categoriaId === catId;
      const matchesQuery = 
        !query || 
        p.nombre.toLowerCase().includes(query) || 
        p.codigoBarras.includes(query);
      return matchesCat && matchesQuery && p.activo;
    });
  });

  // --- MEJORAS POS HÍBRIDO & PESO ---
  mostrarModalPeso = signal(false);
  productoParaPeso = signal<Producto | null>(null);
  pesoIngresado = signal<number | null>(null);
  ultimoProducto = signal<{ nombre: string; cantidad: number; precio: number; unidad: string } | null>(null);

  ngOnInit() {
    this.verificarTurnoCaja();
    this.cargarCatalogo();
    this.cargarClientes();
    this.actualizarVentasPendientes();

    // Consultar el IndexedDB periódicamente para actualizar el contador de pendientes
    this.syncIntervalId = setInterval(() => this.actualizarVentasPendientes(), 5000);
  }

  ngOnDestroy() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
  }

  cargarCatalogo() {
    this.categoriaService.listar().subscribe({
      next: (cats) => this.categorias.set(cats.filter((c) => c.activo)),
      error: () => this.categorias.set([])
    });

    this.productoService.listar({ todo: true }).subscribe({
      next: (res) => this.productos.set(res.productos),
      error: () => this.productos.set([])
    });
  }

  seleccionarCategoria(id: string) {
    this.categoriaSeleccionadaId.set(id);
  }

  obtenerStockDisponible(producto: Producto): number {
    const itemCarrito = this.items().find((item) => item.producto.id === producto.id);
    const cantidadEnCarrito = itemCarrito ? itemCarrito.cantidad : 0;
    return Number(producto.stockActual) - cantidadEnCarrito;
  }

  agregarAlCarrito(producto: Producto) {
    if (!this.turnoActivo()) {
      this.mensajeError.set('Debes abrir la caja primero antes de registrar ventas.');
      return;
    }
    
    if (this.obtenerStockDisponible(producto) <= 0) {
      this.mensajeError.set(`No hay stock suficiente para "${producto.nombre}" en la tienda.`);
      return;
    }

    if (producto.unidadMedida === 'KG' || producto.unidadMedida === 'G') {
      this.productoParaPeso.set(producto);
      this.pesoIngresado.set(null);
      this.mostrarModalPeso.set(true);
      setTimeout(() => {
        const input = document.getElementById('pesoInput') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 50);
    } else {
      this.carritoService.agregarProducto(producto, 1);
      this.actualizarUltimoProducto(producto, 1);
      this.mensajeError.set(null);
    }
  }

  onPesoInputChange(event: any): void {
    const val = Number(event.target.value);
    this.pesoIngresado.set(isNaN(val) ? null : val);
  }

  cerrarModalPeso() {
    this.mostrarModalPeso.set(false);
    this.productoParaPeso.set(null);
    this.pesoIngresado.set(null);
  }

  establecerPesoRapido(peso: number) {
    this.pesoIngresado.set(peso);
    this.confirmarPeso();
  }

  confirmarPeso() {
    const producto = this.productoParaPeso();
    const peso = Number(this.pesoIngresado());
    if (!producto || isNaN(peso) || peso <= 0) {
      this.mensajeError.set('Ingresa un peso válido mayor a cero.');
      return;
    }

    if (this.obtenerStockDisponible(producto) < peso) {
      this.mensajeError.set(`No hay stock suficiente para agregar ${peso} ${producto.unidadMedida} de "${producto.nombre}".`);
      return;
    }

    this.carritoService.agregarProducto(producto, peso);
    this.actualizarUltimoProducto(producto, peso);
    this.cerrarModalPeso();
  }

  actualizarUltimoProducto(producto: Producto, cantidad: number) {
    // Buscar si el producto ya existe en el carrito para mostrar la cantidad total acumulada
    const itemCarrito = this.items().find((item) => item.producto.id === producto.id);
    const cantidadTotal = itemCarrito ? itemCarrito.cantidad : cantidad;

    this.ultimoProducto.set({
      nombre: producto.nombre,
      cantidad: cantidadTotal,
      precio: Number(producto.precioVenta),
      unidad: producto.unidadMedida,
    });
  }

  onBusquedaCatalogoChange(val: string) {
    this.busquedaCatalogo.set(val);
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '';
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + (palabras[1][0] || '')).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  obtenerColorFallback(nombre: string): string {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `linear-gradient(135deg, hsl(${h}, 70%, 55%) 0%, hsl(${(h + 40) % 360}, 80%, 45%) 100%)`;
  }

  verificarTurnoCaja() {
    this.cargandoTurno.set(true);
    this.turnoCajaService.obtenerActivo().subscribe({
      next: (turno) => {
        this.turnoActivo.set(turno);
        this.cargandoTurno.set(false);
      },
      error: () => {
        this.turnoActivo.set(null);
        this.cargandoTurno.set(false);
      }
    });
  }

  cambiarCantidadDirecto(productoId: string, valor: string): void {
    const cantidad = Number(valor);
    const item = this.items().find((i) => i.producto.id === productoId);
    if (!item) return;

    if (isNaN(cantidad) || cantidad <= 0) {
      this.carritoService.quitarProducto(productoId);
      return;
    }

    const producto = this.productos().find((p) => p.id === productoId);
    if (producto) {
      if (Number(producto.stockActual) < cantidad) {
        this.mensajeError.set(`Stock insuficiente. Solo quedan ${producto.stockActual} ${producto.unidadMedida} de "${producto.nombre}".`);
        return;
      }
    }

    this.carritoService.actualizarCantidad(productoId, cantidad);
    
    if (producto) {
      this.actualizarUltimoProducto(producto, cantidad);
    }
  }

  async onCodigoEscaneado(codigo: string): Promise<void> {
    if (!this.turnoActivo()) {
      this.mensajeError.set('No puedes escanear productos. Debes abrir la caja primero.');
      return;
    }

    this.mensajeError.set(null);
    this.cargando.set(true);

    this.productoService.buscarPorCodigoBarras(codigo).subscribe({
      next: (producto) => {
        if (this.obtenerStockDisponible(producto) <= 0) {
          this.mensajeError.set(`No hay stock suficiente para "${producto.nombre}" en la tienda.`);
          this.cargando.set(false);
          return;
        }
        this.cargando.set(false);
        this.agregarAlCarrito(producto);
      },
      error: () => {
        this.mensajeError.set(`No se encontró ningún producto con el código "${codigo}"`);
        this.cargando.set(false);
      },
    });
  }

  incrementar(productoId: string, cantidadActual: number): void {
    const producto = this.productos().find((p) => p.id === productoId);
    if (producto) {
      const stockRestante = Number(producto.stockActual) - cantidadActual;
      const paso = producto.unidadMedida === 'KG' || producto.unidadMedida === 'G' ? 0.1 : 1;
      if (stockRestante < paso) {
        this.mensajeError.set(`No puedes agregar más de "${producto.nombre}". Stock máximo alcanzado.`);
        return;
      }
      const nuevaCantidad = Number((cantidadActual + paso).toFixed(3));
      this.carritoService.actualizarCantidad(productoId, nuevaCantidad);
      this.actualizarUltimoProducto(producto, nuevaCantidad);
    }
  }

  decrementar(productoId: string, cantidadActual: number): void {
    const producto = this.productos().find((p) => p.id === productoId);
    if (producto) {
      const paso = producto.unidadMedida === 'KG' || producto.unidadMedida === 'G' ? 0.1 : 1;
      const nuevaCantidad = Number((cantidadActual - paso).toFixed(3));
      if (nuevaCantidad <= 0) {
        this.carritoService.quitarProducto(productoId);
      } else {
        this.carritoService.actualizarCantidad(productoId, nuevaCantidad);
        this.actualizarUltimoProducto(producto, nuevaCantidad);
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent) {
    const activeEl = document.activeElement as HTMLElement;
    if (
      activeEl && 
      (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA') && 
      !activeEl.classList.contains('scanner-input') &&
      activeEl.id !== 'pesoInput'
    ) {
      return;
    }

    if (event.key === 'F2') {
      event.preventDefault();
      const items = this.items();
      if (items.length > 0) {
        const ultimoItem = items[items.length - 1];
        this.quitar(ultimoItem.producto.id);
      }
    } else if (event.key === 'F4') {
      event.preventDefault();
      const items = this.items();
      if (items.length > 0) {
        const ultimoItem = items[items.length - 1];
        const inputElement = document.getElementById('qty-' + ultimoItem.producto.id) as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          inputElement.select();
        }
      }
    } else if (event.key === 'F9') {
      event.preventDefault();
      this.limpiarCarrito();
    } else if (event.key === 'F10') {
      event.preventDefault();
      if (this.items().length > 0 && !this.procesandoCobro()) {
        this.cobrar('EFECTIVO');
      }
    }
  }

  limpiarCarrito(): void {
    if (this.items().length === 0) return;
    if (confirm('¿Estás seguro de vaciar todo el carrito?')) {
      this.carritoService.limpiar();
      this.ultimoProducto.set(null);
      this.clienteSeleccionado.set(null);
      this.mensajeError.set(null);
    }
  }

  quitar(productoId: string): void {
    this.carritoService.quitarProducto(productoId);
  }

  // Pago Mixto
  mostrarModalMixto = signal(false);
  montoEfectivoMixto = signal<number>(0);
  montoTarjetaMixto = signal<number>(0);

  // Pago QR (Yape/Plin)
  mostrarModalQr = signal(false);

  // Modal de Venta Completada con Éxito
  mostrarModalExito = signal(false);
  ultimaVentaId = signal<string | null>(null);
  ultimoMetodoPago = signal<string | null>(null);
  ultimoTotal = signal<number>(0);
  ultimoCarrito = signal<any[]>([]);
  fechaVentaActual = signal<Date>(new Date());
  clienteSeleccionadoVenta = signal<any | null>(null);

  abrirCobroMixto(): void {
    if (this.items().length === 0) return;
    const totalVenta = this.total();
    this.montoEfectivoMixto.set(totalVenta);
    this.montoTarjetaMixto.set(0);
    this.mostrarModalMixto.set(true);
  }

  cerrarModalMixto(): void {
    this.mostrarModalMixto.set(false);
  }

  abrirModalQr(): void {
    if (this.items().length === 0) return;
    this.mostrarModalQr.set(true);
  }

  cerrarModalQr(): void {
    this.mostrarModalQr.set(false);
  }

  async confirmarPagoQr(): Promise<void> {
    const totalVenta = this.total();
    await this.cobrar('TARJETA', 0, totalVenta, 'YAPE/PLIN');
    this.cerrarModalQr();
  }

  cerrarModalExito(): void {
    this.mostrarModalExito.set(false);
    this.ultimaVentaId.set(null);
    this.ultimoMetodoPago.set(null);
    this.ultimoTotal.set(0);
  }

  onEfectivoChange(val: string): void {
    const totalVenta = this.total();
    const efectivo = Math.min(Number(val) || 0, totalVenta);
    const tarjeta = Number((totalVenta - efectivo).toFixed(2));
    this.montoEfectivoMixto.set(efectivo);
    this.montoTarjetaMixto.set(tarjeta);
  }

  onTarjetaChange(val: string): void {
    const totalVenta = this.total();
    const tarjeta = Math.min(Number(val) || 0, totalVenta);
    const efectivo = Number((totalVenta - tarjeta).toFixed(2));
    this.montoTarjetaMixto.set(tarjeta);
    this.montoEfectivoMixto.set(efectivo);
  }

  esMontoMixtoValido(): boolean {
    const totalVenta = this.total();
    const suma = this.montoEfectivoMixto() + this.montoTarjetaMixto();
    return Math.abs(suma - totalVenta) <= 0.01 && this.montoEfectivoMixto() >= 0 && this.montoTarjetaMixto() >= 0;
  }

  confirmarCobroMixto(): void {
    if (!this.esMontoMixtoValido()) return;
    this.cobrar('MIXTO', this.montoEfectivoMixto(), this.montoTarjetaMixto());
  }

  async cobrar(metodoPago: MetodoPago, montoEfectivo?: number, montoTarjeta?: number, mostrarComo?: string): Promise<void> {
    if (this.items().length === 0) return;
    if (!this.turnoActivo()) {
      this.mensajeError.set('No puedes cobrar. Debes abrir la caja primero.');
      return;
    }

    this.procesandoCobro.set(true);
    const detalles = this.items().map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precioVenta,
    }));

    const turnoId = this.turnoActivo()?.id;

    // Almacenamos el total actual antes de limpiar el carrito
    const totalVenta = this.total();

    try {
      const resultado = await this.ventaService.registrarVenta({ 
        metodoPago, 
        detalles, 
        turnoId,
        montoEfectivo,
        montoTarjeta,
        clienteId: this.clienteSeleccionado()?.id
      });

      // Guardamos la información de la venta completada para el modal de éxito e impresión
      this.ultimaVentaId.set(resultado.id);
      this.ultimoMetodoPago.set(mostrarComo || metodoPago);
      this.ultimoTotal.set(totalVenta);
      this.ultimoCarrito.set([...this.items()]);
      this.fechaVentaActual.set(new Date());
      this.clienteSeleccionadoVenta.set(this.clienteSeleccionado());

      this.procesandoCobro.set(false);
      this.carritoService.limpiar();
      this.clienteSeleccionado.set(null); // Limpiar cliente asociado
      this.actualizarVentasPendientes(); // Forzar actualización de IndexedDB badge
      this.cerrarModalMixto();
      this.mostrarModalExito.set(true); // Abrir confirmación

      if (!resultado.sincronizado) {
        this.mensajeError.set(
          'Venta guardada localmente. Se sincronizará automáticamente cuando vuelva la conexión.',
        );
      } else {
        // Al cobrar con éxito en online, podemos re-consultar el estado de caja para actualizar el flujo
        this.verificarTurnoCaja();
      }
    } catch (err: any) {
      this.procesandoCobro.set(false);
      this.mensajeError.set(err.message || 'Error al procesar el cobro.');
    }
  }

  // --- MÉTODOS DE CLIENTES ---
  cargarClientes(): void {
    this.clienteService.listar({ todo: true }).subscribe({
      next: (res) => this.clientes.set(res.clientes),
      error: (err) => console.error('Error al cargar clientes:', err),
    });
  }

  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado.set(cliente);
    this.busquedaCliente.set('');
  }

  removerClienteSeleccionado(): void {
    this.clienteSeleccionado.set(null);
  }

  onBusquedaClienteChange(val: string): void {
    this.busquedaCliente.set(val);
  }

  // --- MÉTODOS DE SINCRONIZACIÓN ---
  async actualizarVentasPendientes(): Promise<void> {
    try {
      const pendientes = await this.localDb.obtenerPendientes();
      this.ventasPendientesConteo.set(pendientes.length);
    } catch (err) {
      console.error('Error al consultar ventas pendientes:', err);
    }
  }

  // --- IMPRESIÓN ---
  imprimirTicket(): void {
    document.body.classList.add('print-ticket-mode');
    window.print();
    document.body.classList.remove('print-ticket-mode');
  }
}
