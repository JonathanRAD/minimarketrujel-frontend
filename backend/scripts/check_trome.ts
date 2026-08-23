import { PrismaClient } from '@prisma/client';

async function main() {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  const trome = await prisma.producto.findMany({
    where: { nombre: { contains: 'TROME', mode: 'insensitive' } },
    include: {
      ventaDetalles: {
        include: { venta: true }
      }
    }
  });

  for (const t of trome) {
    console.log(`\nProducto: "${t.nombre}" (ID: ${t.id})`);
    console.log(`Stock en BD: ${t.stockActual}`);
    let vendidas = 0;
    t.ventaDetalles.forEach(v => {
      vendidas += Number(v.cantidad);
      console.log(`  - Venta fecha: ${v.venta.fecha.toISOString()} | Cantidad: ${v.cantidad}`);
    });
    console.log(`Total vendidas: ${vendidas}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
