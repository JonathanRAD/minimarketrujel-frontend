import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: { createdAt: 'asc' },
  });

  const mdLines: string[] = [];
  mdLines.push(`# 📦 Catálogo de Productos Registrados (${products.length})`);
  mdLines.push('');
  mdLines.push('Lista actualizada de la base de datos de Supabase con los costos de compra reales y la fecha y hora de registro de cada producto.');
  mdLines.push('');
  mdLines.push('| # | Nombre del Producto | Código de Barras | Categoría | Precio Venta | Costo | Stock Actual | Unidad | Fecha y Hora Agregado |');
  mdLines.push('|---|---|---|---|---|---|---|---|---|');

  products.forEach((p, idx) => {
    const num = idx + 1;
    const catName = p.categoria ? p.categoria.nombre : 'Sin categoría';
    const precioVenta = `S/ ${Number(p.precioVenta).toFixed(2)}`;
    const costo = `S/ ${Number(p.costo).toFixed(2)}`;
    const stock = Number(p.stockActual).toFixed(2);
    const unidad = p.unidadMedida;
    const fecha = new Date(p.createdAt).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    mdLines.push(`| ${num} | **${p.nombre}** | \`${p.codigoBarras}\` | ${catName} | ${precioVenta} | ${costo} | ${stock} | ${unidad} | \`${fecha}\` |`);
  });

  const filePath = path.resolve(__dirname, '../../lista_productos.md');
  fs.writeFileSync(filePath, mdLines.join('\n'), 'utf-8');
  console.log(`Updated ${filePath} with ${products.length} products and creation dates.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
