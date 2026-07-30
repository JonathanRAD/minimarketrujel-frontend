import { PrismaClient, UnidadMedida } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Agregando productos nuevos y actualizando nombre de Ritz ===\n');

  // 1. Obtener ID de la categoría Golosinas
  let golosinasCat = await prisma.categoria.findFirst({
    where: {
      nombre: { equals: 'Golosinas', mode: 'insensitive' }
    }
  });

  if (!golosinasCat) {
    golosinasCat = await prisma.categoria.findFirst({
      where: {
        nombre: { contains: 'Golosinas', mode: 'insensitive' }
      }
    });
  }

  if (!golosinasCat) {
    throw new Error('No se encontró la categoría Golosinas');
  }

  console.log(`Categoría seleccionada: ${golosinasCat.nombre} (ID: ${golosinasCat.id})`);

  // 2. Editar nombre del producto GALLETAS RITZ QUESO 20G. a GALLETAS RITZ QUESO 30G.
  const ritzUpdated = await prisma.producto.updateMany({
    where: {
      codigoBarras: '7622201390013'
    },
    data: {
      nombre: 'GALLETAS RITZ QUESO 30G.'
    }
  });
  console.log(`✔ Actualizado nombre de GALLETAS RITZ QUESO (Registros afectados: ${ritzUpdated.count})`);

  // 3. Crear o actualizar PICARAS - FRESA 38G.
  const picarasFresa = await prisma.producto.upsert({
    where: {
      codigoBarras: '7752748012052'
    },
    update: {
      nombre: 'PICARAS - FRESA 38G.',
      categoriaId: golosinasCat.id,
      precioVenta: 1.20,
      costo: 0.9833,
      stockActual: 6,
      unidadMedida: UnidadMedida.UNIDAD,
      activo: true
    },
    create: {
      nombre: 'PICARAS - FRESA 38G.',
      codigoBarras: '7752748012052',
      categoriaId: golosinasCat.id,
      precioVenta: 1.20,
      costo: 0.9833,
      stockActual: 6,
      stockMinimo: 5,
      unidadMedida: UnidadMedida.UNIDAD,
      activo: true
    }
  });
  console.log(`✔ Producto PICARAS - FRESA 38G. (Código: 7752748012052) guardado correctamente. ID: ${picarasFresa.id}`);

  // 4. Crear o actualizar PICARAS - CLASICA (CHOCOLATE) 38G.
  const picarasClasica = await prisma.producto.upsert({
    where: {
      codigoBarras: '7752748012038'
    },
    update: {
      nombre: 'PICARAS - CLASICA (CHOCOLATE) 38G.',
      categoriaId: golosinasCat.id,
      precioVenta: 1.20,
      costo: 0.8500,
      stockActual: 8,
      unidadMedida: UnidadMedida.UNIDAD,
      activo: true
    },
    create: {
      nombre: 'PICARAS - CLASICA (CHOCOLATE) 38G.',
      codigoBarras: '7752748012038',
      categoriaId: golosinasCat.id,
      precioVenta: 1.20,
      costo: 0.8500,
      stockActual: 8,
      stockMinimo: 5,
      unidadMedida: UnidadMedida.UNIDAD,
      activo: true
    }
  });
  console.log(`✔ Producto PICARAS - CLASICA (CHOCOLATE) 38G. (Código: 7752748012038) guardado correctamente. ID: ${picarasClasica.id}`);

  // 5. Regenerar lista_productos.md
  console.log('\n--- Regenerando lista_productos.md ---');
  const productos = await prisma.producto.findMany({
    include: {
      categoria: true
    },
    orderBy: {
      nombre: 'asc'
    }
  });

  let mdContent = `# 📦 Catálogo de Productos Registrados (${productos.length})\n\n`;
  mdContent += `Lista generada de la base de datos de Supabase.\n\n`;
  mdContent += `| # | Nombre del Producto | Código de Barras | Categoría | Precio Venta | Costo | Stock Actual | Unidad |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|\n`;

  productos.forEach((p, index) => {
    const precio = Number(p.precioVenta).toFixed(2);
    const costo = Number(p.costo).toFixed(4);
    const stock = Number(p.stockActual).toFixed(2);
    mdContent += `| ${index + 1} | **${p.nombre}** | \`${p.codigoBarras}\` | ${p.categoria?.nombre || 'Sin Categoría'} | S/ ${precio} | S/ ${costo} | ${stock} | ${p.unidadMedida} |\n`;
  });

  const outputPath = path.join(__dirname, '../../lista_productos.md');
  fs.writeFileSync(outputPath, mdContent, 'utf-8');
  console.log(`✔ Archivo markdown actualizado en: ${outputPath} con total de ${productos.length} productos.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
