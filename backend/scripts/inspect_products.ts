import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  console.log('--- Inspecting Categories ---');
  const categorias = await prisma.categoria.findMany();
  console.log('Categorías encontradas:', categorias.map(c => ({ id: c.id, nombre: c.nombre })));

  console.log('\n--- Inspecting Ritz Product ---');
  const ritzByCode = await prisma.producto.findMany({
    where: {
      OR: [
        { codigoBarras: { contains: '76222013' } },
        { nombre: { contains: 'RITZ', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Ritz encontrados:', ritzByCode);

  console.log('\n--- Inspecting Picaras Products ---');
  const picaras = await prisma.producto.findMany({
    where: {
      OR: [
        { codigoBarras: '7752748012052' },
        { codigoBarras: '7752748012038' },
        { nombre: { contains: 'PICARAS', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Picaras encontradas:', picaras);
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
