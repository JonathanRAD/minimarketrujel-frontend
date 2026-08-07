import { prisma } from '../src/config/prisma';

async function checkImages() {
  const withImages = await prisma.producto.findMany({
    where: { imagenUrl: { not: null } },
    select: { id: true, codigoBarras: true, nombre: true, imagenUrl: true },
  });

  const withoutImages = await prisma.producto.findMany({
    where: { OR: [{ imagenUrl: null }, { imagenUrl: '' }] },
    select: { id: true, codigoBarras: true, nombre: true },
  });

  console.log(`Products WITH images (${withImages.length}):`);
  withImages.slice(0, 10).forEach((p) => console.log(` - [${p.codigoBarras}] ${p.nombre} → ${p.imagenUrl}`));

  console.log(`\nProducts WITHOUT images (${withoutImages.length}):`);
  withoutImages.slice(0, 15).forEach((p) => console.log(` - [${p.codigoBarras}] ${p.nombre}`));
}

checkImages().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
