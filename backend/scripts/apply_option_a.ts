import { PrismaClient } from '@prisma/client';

async function applyOptionA() {
  const supabaseUrl = "postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
  const prisma = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });

  try {
    console.log('--- APLICANDO AJUSTE OPCIÓN A EN PRODUCCIÓN (Supabase) ---');

    // 1. Obtener usuario admin para registrar movimientos
    const adminUser = await prisma.usuario.findFirst({
      where: { rol: 'ADMIN' }
    });
    const usuarioId = adminUser ? adminUser.id : (await prisma.usuario.findFirst())?.id || '';

    // 2. Ajustar Pan Serrano a 27
    const panSerrano = await prisma.producto.findFirst({
      where: { nombre: { contains: 'PAN PAN SERRANO', mode: 'insensitive' } }
    });

    if (panSerrano) {
      await prisma.producto.update({
        where: { id: panSerrano.id },
        data: { stockActual: 27 }
      });

      if (usuarioId) {
        await prisma.movimientoInventario.create({
          data: {
            productoId: panSerrano.id,
            tipo: 'AJUSTE',
            cantidad: 3,
            motivo: 'Ajuste de stock: Adición de remanente previo a importación Excel',
            usuarioId,
          }
        });
      }
      console.log(`✔ PAN PAN SERRANO actualizado a 27 unidades (Ajuste +3 registrado en Kardex).`);
    } else {
      console.log(`❌ No se encontró PAN PAN SERRANO.`);
    }

    // 3. Ajustar Flan Universal a 7
    const flan = await prisma.producto.findFirst({
      where: { nombre: { contains: 'FLAN UNIVERSAL', mode: 'insensitive' } }
    });

    if (flan) {
      await prisma.producto.update({
        where: { id: flan.id },
        data: { stockActual: 7 }
      });

      if (usuarioId) {
        await prisma.movimientoInventario.create({
          data: {
            productoId: flan.id,
            tipo: 'AJUSTE',
            cantidad: 1,
            motivo: 'Ajuste de stock: Adición de remanente previo a importación Excel',
            usuarioId,
          }
        });
      }
      console.log(`✔ FLAN UNIVERSAL actualizado a 7 unidades (Ajuste +1 registrado en Kardex).`);
    } else {
      console.log(`❌ No se encontró FLAN UNIVERSAL.`);
    }

    // 4. Verificar el estado final de todos los 8 productos del lote
    console.log('\n--- VERIFICACIÓN FINAL DE LOS 8 PRODUCTOS ACTUALIZADOS ---');
    const productosRevisar = [
      'PAN PAN SERRANO',
      'FLAN UNIVERSAL FLAN SABOR A VAINILLA',
      'LECHE EVAPORADA GLORIA 390 GR',
      'AGUA MINERAL - SAN CARLOS 500ML',
      'PAPEL HIGIÉNICO - NOBLE PQ4 UND - 30 MT',
      'PORTOLITA BELTRAN SARDINA ENTOMATADA 230GR.',
      'BISCOCHOS',
      'DETERGENTE TROME 1KG'
    ];

    for (const nom of productosRevisar) {
      const p = await prisma.producto.findFirst({
        where: { nombre: { contains: nom, mode: 'insensitive' } }
      });
      if (p) {
        console.log(`• "${p.nombre}": Stock Actual = ${p.stockActual}`);
      }
    }

  } catch (err: any) {
    console.error('Error al aplicar opción A:', err);
  } finally {
    await prisma.$disconnect();
  }
}

applyOptionA();
