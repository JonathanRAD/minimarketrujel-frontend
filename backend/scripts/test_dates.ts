import { PrismaClient } from '@prisma/client';

async function testDates() {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  const productos = await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: [
      { categoria: { nombre: 'asc' } },
      { nombre: 'asc' },
    ],
    take: 10,
  });

  console.log('--- VERIFICANDO FECHAS REALES DE REGISTRO (createdAt) ---');
  for (const p of productos) {
    console.log(`- [${p.categoria?.nombre}] "${p.nombre}": createdAt = ${p.createdAt.toISOString()}`);
  }

  await prisma.$disconnect();
}

testDates().catch(console.error);
