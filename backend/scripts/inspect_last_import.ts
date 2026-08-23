import { PrismaClient } from '@prisma/client';

async function analyzeAndFix(applyFix: boolean) {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  try {
    // 1. Obtener todos los movimientos de inventario de esa importación (alrededor de 16:36 UTC)
    const inicioLote = new Date('2026-08-23T16:35:00.000Z');
    const finLote = new Date('2026-08-23T16:38:00.000Z');

    const movsLote = await prisma.movimientoInventario.findMany({
      where: {
        fecha: {
          gte: inicioLote,
          lte: finLote
        }
      },
      include: {
        producto: true
      },
      orderBy: { fecha: 'asc' }
    });

    console.log(`\n======================================================`);
    console.log(`LOTE DE IMPORTACIÓN: ${movsLote.length} productos procesados en total`);
    console.log(`======================================================\n`);

    const productosActualizados: any[] = [];
    const productosNuevos: any[] = [];

    for (const mov of movsLote) {
      const p = mov.producto;
      const esNuevo = mov.motivo?.includes('Carga inicial');

      // Buscar todos los movimientos PREVIOS a este lote
      const movsPrevios = await prisma.movimientoInventario.findMany({
        where: {
          productoId: p.id,
          fecha: { lt: inicioLote }
        },
        orderBy: { fecha: 'asc' }
      });

      // Calcular el stock histórico previo sumando/restando todos los movimientos anteriores
      let stockHistoricoCalculado = 0;
      for (const mp of movsPrevios) {
        stockHistoricoCalculado += Number(mp.cantidad);
      }

      const cantExcel = Number(mov.cantidad);
      const stockActualEnDb = Number(p.stockActual);
      const stockCorrectoSumado = stockHistoricoCalculado + cantExcel;

      const itemInfo = {
        id: p.id,
        nombre: p.nombre,
        esNuevo,
        stockPrevio: stockHistoricoCalculado,
        cantExcel: cantExcel,
        stockActualDb: stockActualEnDb,
        stockCorrectoSumado: esNuevo ? cantExcel : stockCorrectoSumado,
        movimientoId: mov.id,
      };

      if (esNuevo) {
        productosNuevos.push(itemInfo);
      } else {
        productosActualizados.push(itemInfo);
      }
    }

    console.log(`--- PRODUCTOS NUEVOS CREADOS (${productosNuevos.length}) ---`);
    for (const n of productosNuevos) {
      console.log(`[NUEVO] "${n.nombre}" -> Stock inicial: ${n.stockActualDb} (Correcto)`);
    }

    console.log(`\n--- PRODUCTOS EXISTENTES QUE FUERON SOBRESCRITOS (${productosActualizados.length}) ---`);
    console.log(`ID | Nombre | Stock Previo | Cant. Excel | Stock en DB (Reemplazado) | Stock Correcto (Sumado)`);
    console.log(`-----------------------------------------------------------------------------------------`);
    for (const a of productosActualizados) {
      console.log(`- "${a.nombre}"`);
      console.log(`    Stock Previo: ${a.stockPrevio} | Cant. Excel: ${a.cantExcel} | Actual en BD: ${a.stockActualDb} ==> Debería ser: ${a.stockCorrectoSumado}`);
    }

    if (applyFix) {
      console.log(`\n>>> APLICANDO CORRECCIÓN EN BASE DE DATOS DE PRODUCCIÓN... <<<`);
      for (const a of productosActualizados) {
        await prisma.producto.update({
          where: { id: a.id },
          data: {
            stockActual: a.stockCorrectoSumado
          }
        });
        console.log(`✔ Corregido: "${a.nombre}" -> Stock Actualizado a ${a.stockCorrectoSumado}`);
      }
      console.log(`\n>>> ¡TODOS LOS PRODUCTOS FUERON CORREGIDOS EXITOSAMENTE! <<<`);
    } else {
      console.log(`\n[Modo Lectura] No se aplicaron cambios. Para aplicar la corrección ejecuta con applyFix = true.`);
    }

  } catch (err: any) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

const shouldFix = process.argv.includes('--fix');
analyzeAndFix(shouldFix);
