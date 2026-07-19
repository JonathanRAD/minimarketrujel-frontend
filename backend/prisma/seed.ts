import 'dotenv/config';
import { PrismaClient, RolUsuario, MetodoPago, EstadoVenta, EstadoCompra, TipoMovimientoInventario, EstadoTurno } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando limpieza de base de datos...');

  // Limpiar todas las tablas para garantizar un seed limpio
  await prisma.fiado.deleteMany({});
  await prisma.movimientoInventario.deleteMany({});
  await prisma.ventaDetalle.deleteMany({});
  await prisma.venta.deleteMany({});
  await prisma.compraDetalle.deleteMany({});
  await prisma.compra.deleteMany({});
  await prisma.turnoCaja.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.categoria.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.proveedor.deleteMany({});
  await prisma.usuario.deleteMany({});

  console.log('🧹 Limpieza completada.');

  console.log('🌱 Generando usuarios de prueba...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const passwordCajeroHash = await bcrypt.hash('cajero123', 10);

  // 1. Crear Administrador y Cajero
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador Principal',
      email: 'admin@minimarket.com',
      passwordHash,
      pin: '1234',
      rol: RolUsuario.ADMIN,
    },
  });

  const cajero = await prisma.usuario.create({
    data: {
      nombre: 'Cajero de Turno',
      email: 'cajero@minimarket.com',
      passwordHash: passwordCajeroHash,
      pin: '5678',
      rol: RolUsuario.CAJERO,
    },
  });

  console.log('🌱 Generando categorías de catálogo...');
  // 2. Categorías
  const categoriasData = [
    { nombre: 'Abarrotes', descripcion: 'Víveres y productos básicos de despensa' },
    { nombre: 'Lácteos', descripcion: 'Leches, yogures, quesos y mantequillas' },
    { nombre: 'Bebidas', descripcion: 'Gaseosas, jugos, aguas y bebidas hidratantes' },
    { nombre: 'Snacks & Golosinas', descripcion: 'Papas fritas, galletas, chocolates y dulces' },
    { nombre: 'Limpieza & Aseo', descripcion: 'Detergentes, jabones y artículos de aseo' },
  ];

  const categorias: any[] = [];
  for (const cat of categoriasData) {
    const createdCat = await prisma.categoria.create({ data: cat });
    categorias.push(createdCat);
  }

  console.log('🌱 Generando proveedores...');
  // 3. Proveedores
  const proveedoresData = [
    { nombre: 'Distribuidora Gloria S.A.', contacto: 'Gloria Ventas', telefono: '987654321', email: 'ventas@gloria.com.pe', direccion: 'Av. República de Panamá 2461' },
    { nombre: 'Alicorp Mayorista', contacto: 'Alicorp Distribución', telefono: '912345678', email: 'mayorista@alicorp.com.pe', direccion: 'Av. Argentina 4793' },
    { nombre: 'Bimbo del Perú', contacto: 'Bimbo Reparto', telefono: '934567890', email: 'reparto@bimbo.com.pe', direccion: 'Calle Las Pleyades 120' },
    { nombre: 'Coca-Cola Bottling Perú', contacto: 'Arca Continental', telefono: '988877766', email: 'pedidos@arcacontal.com', direccion: 'Av. Javier Prado Este 5600' },
    { nombre: 'Nestlé Distribuidora', contacto: 'Nestlé Ventas', telefono: '955443322', email: 'ventas@nestle.com.pe', direccion: 'Av. Los Castillos 340' },
  ];

  const proveedores: any[] = [];
  for (const prov of proveedoresData) {
    const createdProv = await prisma.proveedor.create({ data: prov });
    proveedores.push(createdProv);
  }

  console.log('🌱 Generando clientes con límites de crédito...');
  // 4. Clientes
  const clientesData = [
    { nombre: 'Juan Pérez', telefono: '999111222', direccion: 'Av. Larco 456, Miraflores', limiteCredito: 250.00 },
    { nombre: 'María Rodríguez', telefono: '999222333', direccion: 'Jr. Ica 120, Centro de Lima', limiteCredito: 150.00 },
    { nombre: 'Carlos Mendoza', telefono: '999333444', direccion: 'Av. La Marina 2901, San Miguel', limiteCredito: 300.00 },
    { nombre: 'Ana Gómez', telefono: '999444555', direccion: 'Av. Arequipa 1420, Lince', limiteCredito: 100.00 },
    { nombre: 'Luis Delgado', telefono: '999555666', direccion: 'Calle Tulipanes 345, Surco', limiteCredito: 200.00 },
    { nombre: 'Sofía Castro', telefono: '999666777', direccion: 'Av. Universitaria 1200, Pueblo Libre', limiteCredito: 180.00 },
    { nombre: 'Pedro Ruiz', telefono: '999777888', direccion: 'Av. Brasil 2300, Jesús María', limiteCredito: 400.00 },
    { nombre: 'Lucía Fernández', telefono: '999888999', direccion: 'Calle Grau 540, Chorrillos', limiteCredito: 120.00 },
    { nombre: 'Miguel Torres', telefono: '999000111', direccion: 'Jr. Huallaga 304, Centro de Lima', limiteCredito: 500.00 },
    { nombre: 'Elena Sánchez', telefono: '988111222', direccion: 'Av. Sucre 789, Pueblo Libre', limiteCredito: 150.00 },
    { nombre: 'Jorge Morales', telefono: '988222333', direccion: 'Calle Tarapacá 412, La Victoria', limiteCredito: 200.00 },
    { nombre: 'Carmen Díaz', telefono: '988333444', direccion: 'Jr. Junín 567, Rímac', limiteCredito: 100.00 },
    { nombre: 'Roberto Silva', telefono: '988444555', direccion: 'Av. Próceres 120, Surco', limiteCredito: 300.00 },
    { nombre: 'Patricia Ortiz', telefono: '988555666', direccion: 'Calle Shell 890, Miraflores', limiteCredito: 220.00 },
    { nombre: 'Fernando Herrera', telefono: '988666777', direccion: 'Jr. Bolognesi 302, Magdalena', limiteCredito: 150.00 },
  ];

  const clientes: any[] = [];
  for (const cli of clientesData) {
    const createdCli = await prisma.cliente.create({ data: cli });
    clientes.push(createdCli);
  }

  console.log('🌱 Generando catálogo de productos (30 productos)...');
  // 5. Productos (Spread across categories)
  const catAbarrotes = categorias.find(c => c.nombre === 'Abarrotes').id;
  const catLacteos = categorias.find(c => c.nombre === 'Lácteos').id;
  const catBebidas = categorias.find(c => c.nombre === 'Bebidas').id;
  const catSnacks = categorias.find(c => c.nombre === 'Snacks & Golosinas').id;
  const catLimpieza = categorias.find(c => c.nombre === 'Limpieza & Aseo').id;

  const productosData = [
    // Abarrotes
    { nombre: 'Arroz Extra Costeño 1kg', codigoBarras: '7750101', categoriaId: catAbarrotes, precioVenta: 5.20, costo: 3.80, stockActual: 100, stockMinimo: 15, imagenUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80' },
    { nombre: 'Fideos Tallarín Don Vittorio 500g', codigoBarras: '7750102', categoriaId: catAbarrotes, precioVenta: 3.40, costo: 2.30, stockActual: 80, stockMinimo: 10, imagenUrl: 'https://images.unsplash.com/photo-1621961477414-270dec7f686e?w=200&q=80' },
    { nombre: 'Aceite Primor Premium 1L', codigoBarras: '7750103', categoriaId: catAbarrotes, precioVenta: 8.90, costo: 6.90, stockActual: 50, stockMinimo: 8, imagenUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&q=80' },
    { nombre: 'Atún en Trozos Campomar 170g', codigoBarras: '7750104', categoriaId: catAbarrotes, precioVenta: 6.20, costo: 4.60, stockActual: 60, stockMinimo: 12, imagenUrl: 'https://images.unsplash.com/photo-1534080391025-a77af3ec37db?w=200&q=80' },
    { nombre: 'Azúcar Rubia Cartavio 1kg', codigoBarras: '7750105', categoriaId: catAbarrotes, precioVenta: 4.50, costo: 3.20, stockActual: 120, stockMinimo: 20, imagenUrl: 'https://images.unsplash.com/photo-1581781870027-04212e231e96?w=200&q=80' },
    { nombre: 'Sal Yodada Emsal 1kg', codigoBarras: '7750106', categoriaId: catAbarrotes, precioVenta: 1.80, costo: 1.10, stockActual: 90, stockMinimo: 10, imagenUrl: 'https://images.unsplash.com/photo-1604537466158-719b1972edd8?w=200&q=80' },

    // Lácteos
    { nombre: 'Leche Entera Gloria Tarro 395g', codigoBarras: '7750201', categoriaId: catLacteos, precioVenta: 4.80, costo: 3.70, stockActual: 150, stockMinimo: 25, imagenUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80' },
    { nombre: 'Yogurt Fresa Gloria 1L', codigoBarras: '7750202', categoriaId: catLacteos, precioVenta: 6.50, costo: 4.80, stockActual: 45, stockMinimo: 10, imagenUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80' },
    { nombre: 'Queso Mantecoso Danlac 250g', codigoBarras: '7750203', categoriaId: catLacteos, precioVenta: 12.50, costo: 9.20, stockActual: 20, stockMinimo: 5, imagenUrl: 'https://images.unsplash.com/photo-1486299267070-8382e0543122?w=200&q=80' },
    { nombre: 'Mantequilla con Sal Gloria 200g', codigoBarras: '7750204', categoriaId: catLacteos, precioVenta: 5.50, costo: 4.10, stockActual: 40, stockMinimo: 8, imagenUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&q=80' },
    { nombre: 'Crema de Leche Nestlé 290g', codigoBarras: '7750205', categoriaId: catLacteos, precioVenta: 7.20, costo: 5.50, stockActual: 30, stockMinimo: 6, imagenUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80' },

    // Bebidas
    { nombre: 'Coca Cola Personal 500ml', codigoBarras: '7750301', categoriaId: catBebidas, precioVenta: 2.50, costo: 1.80, stockActual: 100, stockMinimo: 20, imagenUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&q=80' },
    { nombre: 'Inka Kola Familiar 2.25L', codigoBarras: '7750302', categoriaId: catBebidas, precioVenta: 8.50, costo: 6.50, stockActual: 60, stockMinimo: 15, imagenUrl: 'https://images.unsplash.com/photo-1625772290748-3909393a5211?w=200&q=80' },
    { nombre: 'Agua San Luis Sin Gas 1L', codigoBarras: '7750303', categoriaId: catBebidas, precioVenta: 2.00, costo: 1.20, stockActual: 90, stockMinimo: 15, imagenUrl: 'https://images.unsplash.com/photo-1608885898957-a599fb156341?w=200&q=80' },
    { nombre: 'Jugo Frugos de Naranja 1L', codigoBarras: '7750304', categoriaId: catBebidas, precioVenta: 4.50, costo: 3.20, stockActual: 40, stockMinimo: 8, imagenUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&q=80' },
    { nombre: 'Bebida Energizante Sporade 500ml', codigoBarras: '7750305', categoriaId: catBebidas, precioVenta: 2.20, costo: 1.50, stockActual: 70, stockMinimo: 10, imagenUrl: 'https://images.unsplash.com/photo-1527960659354-9337c764c6a6?w=200&q=80' },

    // Snacks & Golosinas
    { nombre: 'Papas Lays Clásicas 160g', codigoBarras: '7750401', categoriaId: catSnacks, precioVenta: 5.50, costo: 3.90, stockActual: 50, stockMinimo: 10, imagenUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&q=80' },
    { nombre: 'Galletas Oreo Familiar 6 unid', codigoBarras: '7750402', categoriaId: catSnacks, precioVenta: 3.20, costo: 2.10, stockActual: 100, stockMinimo: 15, imagenUrl: 'https://images.unsplash.com/photo-1558961309-db6f1ca3d37e?w=200&q=80' },
    { nombre: 'Chocolate Sublime Extragrande 80g', codigoBarras: '7750403', categoriaId: catSnacks, precioVenta: 3.00, costo: 1.90, stockActual: 80, stockMinimo: 12, imagenUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=200&q=80' },
    { nombre: 'Tortees Picantes familiar', codigoBarras: '7750404', categoriaId: catSnacks, precioVenta: 4.20, costo: 2.80, stockActual: 30, stockMinimo: 6, imagenUrl: 'https://images.unsplash.com/photo-1599490659223-e1b979912488?w=200&q=80' },
    { nombre: 'Galletas Casino de Menta familiar', codigoBarras: '7750405', categoriaId: catSnacks, precioVenta: 2.80, costo: 1.80, stockActual: 90, stockMinimo: 10, imagenUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=200&q=80' },
    { nombre: 'Gomitas Ambrosoli 90g', codigoBarras: '7750406', codigoBarras2: '7750406', categoriaId: catSnacks, precioVenta: 2.50, costo: 1.60, stockActual: 60, stockMinimo: 8, imagenUrl: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200&q=80' },

    // Limpieza & Aseo
    { nombre: 'Detergente Opal Ultra Fuerza 1kg', codigoBarras: '7750501', categoriaId: catLimpieza, precioVenta: 9.80, costo: 7.20, stockActual: 40, stockMinimo: 8, imagenUrl: 'https://images.unsplash.com/photo-1610557892470-76d747eed2f3?w=200&q=80' },
    { nombre: 'Suavizante Downy Brisa Fresca 800ml', codigoBarras: '7750502', categoriaId: catLimpieza, precioVenta: 11.50, costo: 8.50, stockActual: 25, stockMinimo: 5, imagenUrl: 'https://images.unsplash.com/photo-1584813539806-2538b8d918c6?w=200&q=80' },
    { nombre: 'Lava Vajillas Ayudín Limón 400g', codigoBarras: '7750503', categoriaId: catLimpieza, precioVenta: 4.50, costo: 3.10, stockActual: 50, stockMinimo: 10, imagenUrl: 'https://images.unsplash.com/photo-1607006342460-7a97f82f7c39?w=200&q=80' },
    { nombre: 'Lejía Clorox Original 1L', codigoBarras: '7750504', categoriaId: catLimpieza, precioVenta: 3.80, costo: 2.40, stockActual: 45, stockMinimo: 8, imagenUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&q=80' },
    { nombre: 'Jabón de Tocador Protex Avena 3 unid', codigoBarras: '7750505', categoriaId: catLimpieza, precioVenta: 8.20, costo: 5.90, stockActual: 30, stockMinimo: 6, imagenUrl: 'https://images.unsplash.com/photo-1607006342400-b702196f7021?w=200&q=80' },
    { nombre: 'Papel Higiénico Elite Doble Hoja 4 rollos', codigoBarras: '7750506', categoriaId: catLimpieza, precioVenta: 4.80, costo: 3.40, stockActual: 70, stockMinimo: 12, imagenUrl: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=200&q=80' },
    { nombre: 'Shampoo Head & Shoulders Limpieza 375ml', codigoBarras: '7750507', categoriaId: catLimpieza, precioVenta: 15.90, costo: 11.80, stockActual: 20, stockMinimo: 4, imagenUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&q=80' },
    { nombre: 'Desodorante Rexona Clinical Hombre 48g', codigoBarras: '7750508', categoriaId: catLimpieza, precioVenta: 16.50, costo: 12.00, stockActual: 15, stockMinimo: 3, imagenUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200&q=80' },
  ];

  const productos: any[] = [];
  for (const prod of productosData) {
    const createdProd = await prisma.producto.create({
      data: {
        nombre: prod.nombre,
        codigoBarras: prod.codigoBarras,
        categoriaId: prod.categoriaId,
        precioVenta: prod.precioVenta,
        costo: prod.costo,
        stockActual: prod.stockActual,
        stockMinimo: prod.stockMinimo,
        imagenUrl: prod.imagenUrl,
        unidadMedida: 'UNIDAD',
        activo: true,
      },
    });
    productos.push(createdProd);
  }

  console.log('🌱 Generando historial de 12 turnos de caja...');
  // 6. Turnos de Caja (12 turnos, 11 cerrados, 1 abierto)
  const turnos: any[] = [];
  const baseDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const dateApertura = new Date(baseDate);
    dateApertura.setDate(baseDate.getDate() - i);
    dateApertura.setHours(8, 0, 0, 0);

    const dateCierre = new Date(dateApertura);
    dateCierre.setHours(20, 0, 0, 0);

    const esAbierto = i === 0;
    const montoInicial = 150.00;

    const turno = await prisma.turnoCaja.create({
      data: {
        usuarioId: i % 2 === 0 ? admin.id : cajero.id,
        fechaApertura: dateApertura,
        fechaCierre: esAbierto ? null : dateCierre,
        montoInicial,
        estado: esAbierto ? EstadoTurno.ABIERTO : EstadoTurno.CERRADO,
        // Cargar montos si está cerrado
        montoFinalEsperado: esAbierto ? null : 0.00, // se actualizará dinámicamente al sumar ventas en la base
        montoFinalReal: esAbierto ? null : 0.00,
        diferencia: esAbierto ? null : 0.00,
      },
    });
    turnos.push(turno);
  }

  console.log('🌱 Generando ventas, detalles y fiados distribuidos (35 ventas)...');
  // 7. Ventas & Detalles (35 Ventas)
  const metodosPago = [MetodoPago.EFECTIVO, MetodoPago.TARJETA, MetodoPago.MIXTO, MetodoPago.FIADO];

  for (let j = 0; j < 35; j++) {
    // Escoger turno cerrado (índices 0 a 10 de la lista turnos)
    const turno = turnos[j % 11];
    const cliente = clientes[j % clientes.length];
    const metodoPago = metodosPago[j % metodosPago.length];

    const fechaVenta = new Date(turno.fechaApertura);
    fechaVenta.setMinutes(fechaVenta.getMinutes() + (j * 15) + 30); // Distribuidas en el turno

    // Escoger de 1 a 4 productos aleatorios para la venta
    const numItems = (j % 4) + 1;
    const detallesVenta: any[] = [];
    let totalCalculado = 0;

    for (let k = 0; k < numItems; k++) {
      const prodIndex = (j + k * 7) % productos.length;
      const product = productos[prodIndex];
      const cantidad = (j % 2 === 0) ? 1 : 2;
      const subtotal = cantidad * Number(product.precioVenta);

      detallesVenta.push({
        productoId: product.id,
        cantidad,
        precioUnitario: product.precioVenta,
        subtotal,
      });
      totalCalculado += subtotal;
    }

    const esFiado = metodoPago === MetodoPago.FIADO;
    const esMixto = metodoPago === MetodoPago.MIXTO;

    const montoEfectivo = esFiado ? 0 : (esMixto ? Number((totalCalculado / 2).toFixed(2)) : (metodoPago === MetodoPago.EFECTIVO ? totalCalculado : 0));
    const montoTarjeta = esFiado ? 0 : (esMixto ? Number((totalCalculado / 2).toFixed(2)) : (metodoPago === MetodoPago.TARJETA ? totalCalculado : 0));

    const venta = await prisma.venta.create({
      data: {
        usuarioId: turno.usuarioId,
        clienteId: esFiado ? cliente.id : null,
        turnoId: turno.id,
        fecha: fechaVenta,
        total: totalCalculado,
        metodoPago,
        montoEfectivo,
        montoTarjeta,
        estado: EstadoVenta.COMPLETADA,
        sincronizado: true,
        detalles: {
          create: detallesVenta.map(d => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.subtotal,
          })),
        },
      },
      include: { detalles: true },
    });

    // Registrar descuento de stock y movimientos de inventario
    for (const d of venta.detalles) {
      await prisma.producto.update({
        where: { id: d.productoId },
        data: { stockActual: { decrement: d.cantidad } },
      });

      await prisma.movimientoInventario.create({
        data: {
          productoId: d.productoId,
          tipo: TipoMovimientoInventario.VENTA,
          cantidad: -Number(d.cantidad),
          motivo: `Venta #${venta.id.substring(0, 8)}`,
          usuarioId: turno.usuarioId,
          referenciaId: venta.id,
          fecha: fechaVenta,
        },
      });
    }

    // Registrar el Fiado si el pago es crédito
    if (esFiado) {
      const fechaLimite = new Date(fechaVenta);
      fechaLimite.setDate(fechaLimite.getDate() + 15); // 15 días límite

      await prisma.fiado.create({
        data: {
          clienteId: cliente.id,
          ventaId: venta.id,
          monto: totalCalculado,
          pagado: j % 3 === 0, // algunos ya pagados para dar realismo
          fechaLimite,
          createdAt: fechaVenta,
        },
      });
    }
  }

  console.log('🌱 Generando compras a proveedores (15 compras)...');
  // 8. Compras & Detalles (15 compras)
  const estadosCompra = [EstadoCompra.RECIBIDA, EstadoCompra.PENDIENTE, EstadoCompra.CANCELADA];

  for (let cIdx = 0; cIdx < 15; cIdx++) {
    const prov = proveedores[cIdx % proveedores.length];
    const turno = turnos[cIdx % 11]; // asociar a un turno cerrado
    const estado = estadosCompra[cIdx % estadosCompra.length];

    const fechaCompra = new Date(turno.fechaApertura);
    fechaCompra.setHours(fechaCompra.getHours() + 2); // compra temprano en el turno

    // Comprar de 1 a 3 productos
    const numProds = (cIdx % 3) + 1;
    const detallesCompra: any[] = [];
    let totalCalculado = 0;

    for (let k = 0; k < numProds; k++) {
      const prodIndex = (cIdx + k * 5) % productos.length;
      const product = productos[prodIndex];
      const cantidad = (cIdx % 2 === 0) ? 10 : 20;
      const subtotal = cantidad * Number(product.costo);

      detallesCompra.push({
        productoId: product.id,
        cantidad,
        costoUnitario: product.costo,
        subtotal,
      });
      totalCalculado += subtotal;
    }

    const compra = await prisma.compra.create({
      data: {
        proveedorId: prov.id,
        usuarioId: admin.id,
        fecha: fechaCompra,
        total: totalCalculado,
        estado,
        detalles: {
          create: detallesCompra.map(d => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            costoUnitario: d.costoUnitario,
            subtotal: d.subtotal,
          })),
        },
      },
      include: { detalles: true },
    });

    // Si la compra fue RECIBIDA, incrementamos stock y registramos movimientos en Kardex
    if (estado === EstadoCompra.RECIBIDA) {
      for (const d of compra.detalles) {
        await prisma.producto.update({
          where: { id: d.productoId },
          data: { stockActual: { increment: d.cantidad } },
        });

        await prisma.movimientoInventario.create({
          data: {
            productoId: d.productoId,
            tipo: TipoMovimientoInventario.COMPRA,
            cantidad: d.cantidad,
            motivo: `Compra #${compra.id.substring(0, 8)}`,
            usuarioId: admin.id,
            referenciaId: compra.id,
            fecha: fechaCompra,
          },
        });
      }
    }
  }

  console.log('🌱 Generando algunos ajustes y mermas en Kardex...');
  // 9. Movimientos manuales de inventario (Ajustes y Mermas)
  for (let aIdx = 0; aIdx < 5; aIdx++) {
    const product = productos[aIdx * 4 % productos.length];
    const esMerma = aIdx % 2 === 0;

    const fechaMov = new Date(baseDate);
    fechaMov.setDate(baseDate.getDate() - aIdx - 1);
    fechaMov.setHours(15, 0, 0, 0);

    const cantidad = esMerma ? -2 : 5;

    await prisma.producto.update({
      where: { id: product.id },
      data: { stockActual: { increment: cantidad } },
    });

    await prisma.movimientoInventario.create({
      data: {
        productoId: product.id,
        tipo: esMerma ? TipoMovimientoInventario.MERMA : TipoMovimientoInventario.AJUSTE,
        cantidad,
        motivo: esMerma ? 'Producto vencido / dañado' : 'Ajuste inventario físico mensual',
        usuarioId: admin.id,
        fecha: fechaMov,
      },
    });
  }

  console.log('🌱 Actualizando montos contables finales de turnos de caja cerrados...');
  // 10. Recalcular y cerrar los turnos de caja con datos reales históricos para el arqueo
  for (const t of turnos) {
    if (t.estado === EstadoTurno.ABIERTO) continue;

    // Sumar ventas asociadas a este turno
    const ventasTurno = await prisma.venta.findMany({
      where: {
        turnoId: t.id,
        estado: EstadoVenta.COMPLETADA,
      },
    });

    let efectivoVentas = 0;
    let tarjetaVentas = 0;

    for (const v of ventasTurno) {
      if (v.metodoPago === MetodoPago.EFECTIVO) {
        efectivoVentas += Number(v.total);
      } else if (v.metodoPago === MetodoPago.TARJETA) {
        tarjetaVentas += Number(v.total);
      } else if (v.metodoPago === MetodoPago.MIXTO) {
        efectivoVentas += Number(v.montoEfectivo);
        tarjetaVentas += Number(v.montoTarjeta);
      }
    }

    const efectivoEsperado = Number(t.montoInicial) + efectivoVentas;
    const tarjetaEsperada = tarjetaVentas;
    const totalEsperado = efectivoEsperado + tarjetaEsperada;

    // Simular arqueo sin descuadre o con descuadre mínimo (ej. una diferencia de -S/ 0.50 o S/ 1.00 en algunos turnos)
    const tieneDescuadre = Number(t.id.substring(0, 1)) % 3 === 0;
    const diferencia = tieneDescuadre ? (Number(t.id.substring(1, 2)) % 2 === 0 ? -1.50 : 2.00) : 0.00;

    const efectivoReal = efectivoEsperado + (tieneDescuadre ? diferencia : 0);
    const tarjetaReal = tarjetaEsperada;
    const totalReal = totalEsperado + (tieneDescuadre ? diferencia : 0);

    const auditoriaArqueo = {
      efectivoEsperado,
      tarjetaEsperada,
      efectivoReal,
      tarjetaReal,
      diferenciaEfectivo: tieneDescuadre ? diferencia : 0,
      diferenciaTarjeta: 0,
      conteoMonedasBilletes: {
        b100: Math.floor(efectivoReal / 100),
        b50: Math.floor((efectivoReal % 100) / 50),
        b20: Math.floor((efectivoReal % 50) / 20),
        b10: Math.floor((efectivoReal % 20) / 10),
        m5: Math.floor((efectivoReal % 10) / 5),
        m2: Math.floor((efectivoReal % 5) / 2),
        m1: Math.floor((efectivoReal % 2) / 1),
      },
    };

    await prisma.turnoCaja.update({
      where: { id: t.id },
      data: {
        montoFinalEsperado: totalEsperado,
        montoFinalReal: totalReal,
        diferencia: tieneDescuadre ? diferencia : 0,
        auditoriaArqueo,
      },
    });
  }

  console.log('🏁 Seed completado con éxito.');
  console.log('🔑 Credenciales Administrador: admin@minimarket.com (password: admin123, PIN: 1234)');
  console.log('🔑 Credenciales Cajero: cajero@minimarket.com (password: cajero123, PIN: 5678)');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
