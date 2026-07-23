import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Recuperando lista de productos desde Supabase ===\n');

  const productos = await prisma.producto.findMany({
    include: {
      categoria: true
    },
    orderBy: {
      nombre: 'asc'
    }
  });

  console.log(`Total de productos encontrados: ${productos.length}\n`);

  productos.forEach((p, index) => {
    console.log(`[${index + 1}] NOMBRE: ${p.nombre}`);
    console.log(`    Código de Barras: ${p.codigoBarras}`);
    console.log(`    Categoría: ${p.categoria?.nombre || 'Sin Categoría'}`);
    console.log(`    Precio Venta: S/ ${Number(p.precioVenta).toFixed(2)}`);
    console.log(`    Costo: S/ ${Number(p.costo).toFixed(2)}`);
    console.log(`    Stock Actual: ${p.stockActual} ${p.unidadMedida}`);
    console.log(`    Imagen URL: ${p.imagenUrl || 'No tiene'}`);
    console.log('----------------------------------------------------');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
