import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Generando lista_productos.md desde Supabase ===');

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
    const costo = Number(p.costo).toFixed(2);
    const stock = Number(p.stockActual).toFixed(2);
    mdContent += `| ${index + 1} | **${p.nombre}** | \`${p.codigoBarras}\` | ${p.categoria?.nombre || 'Sin Categoría'} | S/ ${precio} | S/ ${costo} | ${stock} | ${p.unidadMedida} |\n`;
  });

  const outputPath = path.join(__dirname, '../../lista_productos.md');
  fs.writeFileSync(outputPath, mdContent, 'utf-8');

  console.log(`✔ Archivo markdown creado en: ${outputPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
