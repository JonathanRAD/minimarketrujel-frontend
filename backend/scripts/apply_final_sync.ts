import { PrismaClient } from '@prisma/client';

async function applyFinalStock() {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  try {
    console.log('=== APLICANDO SINCRONIZACIÓN DE STOCK REAL EN PRODUCCIÓN (Supabase) ===\n');

    const adminUser = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
    const usuarioId = adminUser ? adminUser.id : (await prisma.usuario.findFirst())?.id || '';

    // Lista de productos con sus stocks finales auditados
    const ajustes = [
      {
        filtro: 'LECHE EVAPORADA GLORIA 390 GR',
        stockFinal: 35,
        detalle: 'Balance: 36 ingresados en Excel - 25 vendidos en caja + 24 nuevo lote'
      },
      {
        filtro: 'AGUA MINERAL - SAN CARLOS 500ML',
        stockFinal: 33,
        detalle: 'Balance: 20 ingresados en Excel - 7 vendidos en caja + 20 nuevo lote'
      },
      {
        filtro: 'PAPEL HIGIÉNICO - NOBLE PQ4 UND - 30 MT',
        stockFinal: 17,
        detalle: 'Balance: 24 ingresados en Excel - 15 vendidos en caja + 8 nuevo lote'
      },
      {
        filtro: 'DETERGENTE TROME 1KG',
        stockFinal: 7,
        detalle: 'Balance: 6 ingresados en Excel - 5 vendidos en caja + 6 nuevo lote'
      },
      {
        filtro: 'PAN PAN SERRANO',
        stockFinal: 27,
        detalle: 'Balance: 24 ingresados en Excel - 21 vendidos en caja + 24 nuevo lote'
      },
      {
        filtro: 'FLAN UNIVERSAL FLAN SABOR A VAINILLA',
        stockFinal: 7,
        detalle: 'Balance: 3 ingresados en Excel - 2 vendidos en caja + 6 nuevo lote'
      },
      {
        filtro: 'PORTOLITA BELTRAN SARDINA ENTOMATADA 230GR.',
        stockFinal: 6,
        detalle: 'Balance: 3 ingresados en Excel - 3 vendidos en caja + 6 nuevo lote'
      },
      {
        filtro: 'BISCOCHOS',
        stockFinal: 24,
        detalle: 'Balance: 24 ingresados en Excel - 24 vendidos en caja + 24 nuevo lote'
      }
    ];

    for (const item of ajustes) {
      const p = await prisma.producto.findFirst({
        where: { nombre: { contains: item.filtro, mode: 'insensitive' } }
      });

      if (!p) {
        console.log(`❌ No se encontró producto con filtro: "${item.filtro}"`);
        continue;
      }

      const stockAnterior = Number(p.stockActual);
      const diferencia = item.stockFinal - stockAnterior;

      await prisma.producto.update({
        where: { id: p.id },
        data: { stockActual: item.stockFinal }
      });

      if (diferencia !== 0 && usuarioId) {
        await prisma.movimientoInventario.create({
          data: {
            productoId: p.id,
            tipo: 'AJUSTE',
            cantidad: diferencia,
            motivo: `Ajuste auditoría balance histórico (${item.detalle})`,
            usuarioId,
          }
        });
      }

      console.log(`✔ "${p.nombre}"`);
      console.log(`   Stock anterior: ${stockAnterior} -> STOCK FINAL ACTUALIZADO: ${item.stockFinal}`);
      console.log(`   ${item.detalle}\n`);
    }

    console.log('--- REVISIÓN GENERAL DE LOS 17 PRODUCTOS DEL LOTE EN BD ---');
    const todosLote = [
      'LECHE EVAPORADA GLORIA 390 GR',
      'ACEITE PATRONA ACEITE VEGETAL 1LT.',
      'AGUA MINERAL - SAN CARLOS 500ML',
      'VELAS LUZ RADIANTE VELAS DE CERA BLANCAS UNIDAD',
      'SALSA DE TOMATE POMAROLA CLÁSICA 145G.',
      'PAPEL HIGIÉNICO - NOBLE PQ4 UND - 30 MT',
      'PORTOLITA BELTRAN SARDINA ENTOMATADA 230GR.',
      'PINZAS DE ROPA',
      'PAÑITOS HÚMEDOS VEESPER PAÑITOS HÚMEDOS PARA LIMPIEZA PERSONAL PAQ. 100 UND.',
      'BOLSAS DE BASURA BOLSAS DE BASURA 45X45',
      'PAN PAN SERRANO',
      'BISCOCHOS',
      'MAIZ PERLITA MAIZ PERLITA A GRANEL MAIZ PARA HACER POPCORN',
      'LENTEJAS LENTEJAS A GRANEL LENTEJAS A GRANEL',
      'DETERGENTE TROME 1KG',
      'FLAN UNIVERSAL FLAN SABOR A VAINILLA',
      'ESCENCIA DE VAINILLA NEGRITA 30ML.'
    ];

    for (const nom of todosLote) {
      const prod = await prisma.producto.findFirst({
        where: { nombre: { contains: nom, mode: 'insensitive' } }
      });
      if (prod) {
        console.log(`• [${prod.stockActual.toString().padStart(3)} und] ${prod.nombre}`);
      }
    }

    console.log('\n>>> ¡SINCRONIZACIÓN COMPLETADA CON ÉXITO! <<<');

  } catch (err: any) {
    console.error('Error al aplicar sincronización:', err);
  } finally {
    await prisma.$disconnect();
  }
}

applyFinalStock();
