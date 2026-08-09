import 'dotenv/config';
import { PrismaClient, RolUsuario } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpieza total de la base de datos...');

  // Limpiar todas las tablas para garantizar un estado vacío
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

  console.log('✨ Base de datos completamente vaciada.');

  console.log('🔑 Creando usuarios de acceso principal...');
  const passwordHash = await bcrypt.hash('060266', 10);
  const passwordCajeroHash = await bcrypt.hash('060266', 10);

  // Crear Administrador
  await prisma.usuario.create({
    data: {
      nombre: 'Administrador Principal',
      email: 'admin@minimarket.com',
      passwordHash,
      pin: '060266',
      rol: RolUsuario.ADMIN,
    },
  });

  // Crear Cajero
  await prisma.usuario.create({
    data: {
      nombre: 'Cajero de Turno',
      email: 'cajero@minimarket.com',
      passwordHash: passwordCajeroHash,
      pin: '5678',
      rol: RolUsuario.CAJERO,
    },
  });

  console.log('🖼️ Creando 10 productos de prueba del Excel con imagen...');

  const catAbarrotes = await prisma.categoria.create({
    data: { nombre: 'ABARROTES', descripcion: 'Víveres generales' },
  });

  const productosConImagen = [
    {
      nombre: 'REFRESCO EN POLVO UMSHA SABOR CHICHA MORADA 13GR.',
      codigoBarras: 'SC-112000',
      precioVenta: 1.20,
      costo: 1.00,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=200&q=80',
    },
    {
      nombre: 'REFRESCO EN POLVO UMSHA SABOR MARACUYA 13GR.',
      codigoBarras: 'SC-113000',
      precioVenta: 1.20,
      costo: 1.00,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&q=80',
    },
    {
      nombre: 'MARGARINA MANTY MARGARINA EN POTE 90GR.',
      codigoBarras: 'SC-114000',
      precioVenta: 3.00,
      costo: 2.50,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&q=80',
    },
    {
      nombre: 'VINAGRE TINTO DEL FIRME 125ML.',
      codigoBarras: 'SC-115000',
      precioVenta: 1.80,
      costo: 1.30,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&q=80',
    },
    {
      nombre: 'SHAMPOO PANTENE SACHET RIZOS DEFINIDOS 18ML.',
      codigoBarras: 'SC-116000',
      precioVenta: 1.50,
      costo: 0.775,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&q=80',
    },
    {
      nombre: 'FIDEO ANITA CABELLO DE ANGEL AMARILLO 250GR.',
      codigoBarras: 'SC-117000',
      precioVenta: 1.80,
      costo: 1.30,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1621961477414-270dec7f686e?w=200&q=80',
    },
    {
      nombre: 'LECHE CONDENSADA NESTLE TOPPING 397GR.',
      codigoBarras: 'SC-118000',
      precioVenta: 6.50,
      costo: 5.50,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
    },
    {
      nombre: 'LEJIA LIGURIA LEJIA TRADICIONAL 345GR.',
      codigoBarras: 'SC-119000',
      precioVenta: 1.70,
      costo: 1.20,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1584813539806-2538b8d918c6?w=200&q=80',
    },
    {
      nombre: 'ENJUAGUE DE ROPA DOWNY AROMA FLORAL 70ML.',
      codigoBarras: 'SC-120000',
      precioVenta: 1.50,
      costo: 1.00,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1610557892470-76d747eed2f3?w=200&q=80',
    },
    {
      nombre: 'SOPA INSTANTÁNEA AJINOMÉN GALLINA 80GR.',
      codigoBarras: 'SC-121000',
      precioVenta: 2.20,
      costo: 1.70,
      stockActual: 5,
      imagenUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80',
    },
  ];

  for (const p of productosConImagen) {
    await prisma.producto.create({
      data: {
        ...p,
        categoriaId: catAbarrotes.id,
        stockMinimo: 2,
        unidadMedida: 'UNIDAD',
        activo: true,
      },
    });
  }

  console.log('✅ Base de datos lista con 10 productos con imagen.');
  console.log('🔑 Usuario Admin: admin@minimarket.com / 060266 (PIN: 060266)');
  console.log('🔑 Usuario Cajero: cajero@minimarket.com / 060266 (PIN: 5678)');
}

main()
  .catch((e) => {
    console.error('❌ Error al limpiar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
