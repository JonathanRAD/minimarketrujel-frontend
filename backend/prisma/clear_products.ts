import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Eliminando todos los productos de la base de datos...');
  
  // Limpiar posibles relaciones de integridad referencial
  await prisma.movimientoInventario.deleteMany({});
  await prisma.ventaDetalle.deleteMany({});
  await prisma.compraDetalle.deleteMany({});
  await prisma.fiado.deleteMany({});
  await prisma.venta.deleteMany({});
  await prisma.compra.deleteMany({});
  
  // Eliminar productos
  const result = await prisma.producto.deleteMany({});
  
  console.log(`✅ Se han eliminado todos los productos (${result.count} eliminados).`);
  console.log('🏷️ Las categorías permanecen intactas en la base de datos.');
}

main()
  .catch((e) => {
    console.error('❌ Error al eliminar los productos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
