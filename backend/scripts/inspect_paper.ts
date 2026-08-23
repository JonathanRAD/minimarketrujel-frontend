import { PrismaClient } from '@prisma/client';

async function main() {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  try {
    const nombres = [
      'PAPEL HIGIÉNICO - NOBLE PQ4 UND - 30 MT',
      'LECHE EVAPORADA GLORIA 390 GR',
      'AGUA MINERAL - SAN CARLOS 500ML',
      'DETERGENTE TROME 1KG',
      'PAN PAN SERRANO'
    ];

    for (const nom of nombres) {
      const p = await prisma.producto.findFirst({
        where: { nombre: nom }
      });

      if (!p) {
        console.log(`\nNo se encontró: ${nom}`);
        continue;
      }

      console.log(`\n======================================================`);
      console.log(`PRODUCTO: [${p.id}] "${p.nombre}"`);
      console.log(`Stock Actual en BD: ${p.stockActual} | Creado: ${p.createdAt}`);
      console.log(`======================================================`);

      const movs = await prisma.movimientoInventario.findMany({
        where: { productoId: p.id },
        include: { usuario: true },
        orderBy: { fecha: 'asc' }
      });

      console.log(`Historial de Movimientos (${movs.length}):`);
      let balance = 0;
      for (const m of movs) {
        balance += Number(m.cantidad);
        console.log(`  * [${m.fecha.toISOString()}] Tipo: ${m.tipo.padEnd(7)} | Cant: ${String(m.cantidad).padStart(5)} | Motivo: "${m.motivo}" | Balance: ${balance}`);
      }

      const ventasDetalle = await prisma.ventaDetalle.findMany({
        where: { productoId: p.id },
        include: { venta: true },
        orderBy: { venta: { fecha: 'asc' } }
      });
      console.log(`Total ventas en detalle: ${ventasDetalle.length}`);
    }

  } catch (err: any) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
