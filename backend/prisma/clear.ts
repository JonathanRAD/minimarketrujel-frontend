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
  const passwordHash = await bcrypt.hash('admin123', 10);
  const passwordCajeroHash = await bcrypt.hash('cajero123', 10);

  // Crear Administrador
  await prisma.usuario.create({
    data: {
      nombre: 'Administrador Principal',
      email: 'admin@minimarket.com',
      passwordHash,
      pin: '1234',
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

  console.log('✅ Base de datos lista para usar.');
  console.log('🔑 Usuario Admin: admin@minimarket.com / admin123 (PIN: 1234)');
  console.log('🔑 Usuario Cajero: cajero@minimarket.com / cajero123 (PIN: 5678)');
}

main()
  .catch((e) => {
    console.error('❌ Error al limpiar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
