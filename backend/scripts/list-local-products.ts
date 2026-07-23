import { PrismaClient } from '@prisma/client';

const localPrisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:123456@localhost:5432/minimarketrujel?schema=public' },
  },
});

async function main() {
  console.log('=== Recuperando lista de productos desde la base de datos LOCAL ===\n');

  try {
    const productos = await localPrisma.producto.findMany({
      include: {
        categoria: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log(`Total de productos locales encontrados: ${productos.length}\n`);

    productos.forEach((p, index) => {
      console.log(`[${index + 1}] NOMBRE: ${p.nombre}`);
      console.log(`    Código de Barras: ${p.codigoBarras}`);
      console.log(`    Categoría: ${p.categoria?.nombre || 'Sin Categoría'}`);
      console.log(`    Precio Venta: S/ ${Number(p.precioVenta).toFixed(2)}`);
      console.log(`    Costo: S/ ${Number(p.costo).toFixed(2)}`);
      console.log(`    Stock Actual: ${p.stockActual} ${p.unidadMedida}`);
      console.log('----------------------------------------------------');
    });
  } catch (err) {
    console.error('Error al conectar a la base de datos local:', err);
  } finally {
    await localPrisma.$disconnect();
  }
}

main();
