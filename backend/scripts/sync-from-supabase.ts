import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const SUPABASE_URL = 'postgresql://postgres.deevblctrnsfeojehftu:Elmaspro_123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function syncFromSupabase() {
  console.log('📡 Conectando a Supabase (Solo Lectura)...');
  const supabasePrisma = new PrismaClient({
    datasources: { db: { url: SUPABASE_URL } },
  });

  console.log('💻 Conectando a PostgreSQL Local (Lectura/Escritura)...');
  const localPrisma = new PrismaClient();

  try {
    // 1. LEER DATOS DE SUPABASE DE FORMA SECUENCIAL (100% LECTURA, SIN TOCAR SUPABASE)
    console.log('📥 Obteniendo catálogo y datos reales desde Supabase...');
    
    const usuarios = await supabasePrisma.usuario.findMany();
    const categorias = await supabasePrisma.categoria.findMany();
    const productos = await supabasePrisma.producto.findMany();
    const clientes = await supabasePrisma.cliente.findMany();
    const proveedores = await supabasePrisma.proveedor.findMany();
    const promociones = await supabasePrisma.promocion.findMany();
    const turnos = await supabasePrisma.turnoCaja.findMany();
    const ventas = await supabasePrisma.venta.findMany();
    const ventaDetalles = await supabasePrisma.ventaDetalle.findMany();
    const fiados = await supabasePrisma.fiado.findMany();
    const compras = await supabasePrisma.compra.findMany();
    const compraDetalles = await supabasePrisma.compraDetalle.findMany();
    const movimientos = await supabasePrisma.movimientoInventario.findMany();

    console.log(`\n✨ Datos leídos desde Supabase:
    - ${usuarios.length} Usuarios
    - ${categorias.length} Categorías
    - ${productos.length} Productos con códigos de barras reales
    - ${clientes.length} Clientes
    - ${proveedores.length} Proveedores
    - ${compras.length} Compras
    - ${ventas.length} Ventas
    - ${movimientos.length} Movimientos de inventario (Kardex)`);

    // 2. VACIAR BASE DE DATOS LOCAL
    console.log('\n🧹 Vaciando base de datos local...');
    await localPrisma.fiado.deleteMany({});
    await localPrisma.movimientoInventario.deleteMany({});
    await localPrisma.ventaDetalle.deleteMany({});
    await localPrisma.venta.deleteMany({});
    await localPrisma.compraDetalle.deleteMany({});
    await localPrisma.compra.deleteMany({});
    await localPrisma.turnoCaja.deleteMany({});
    await localPrisma.promocion.deleteMany({});
    await localPrisma.producto.deleteMany({});
    await localPrisma.categoria.deleteMany({});
    await localPrisma.cliente.deleteMany({});
    await localPrisma.proveedor.deleteMany({});
    await localPrisma.usuario.deleteMany({});

    // 3. COPIAR DATOS A LOCAL
    console.log('🚚 Copiando catálogo real a tu PostgreSQL local...');

    const passwordHash060266 = await bcrypt.hash('060266', 10);

    for (const u of usuarios) {
      await localPrisma.usuario.create({
        data: {
          ...u,
          passwordHash: passwordHash060266, // Contraseña 060266 para login local
          pin: u.pin || '060266',
        },
      });
    }

    for (const c of categorias) {
      await localPrisma.categoria.create({ data: c });
    }

    for (const p of productos) {
      await localPrisma.producto.create({ data: p });
    }

    for (const cli of clientes) {
      await localPrisma.cliente.create({ data: cli });
    }

    for (const prov of proveedores) {
      await localPrisma.proveedor.create({ data: prov });
    }

    for (const pro of promociones) {
      await localPrisma.promocion.create({ data: pro });
    }

    for (const t of turnos) {
      await localPrisma.turnoCaja.create({ data: t });
    }

    for (const v of ventas) {
      await localPrisma.venta.create({ data: v });
    }

    for (const vd of ventaDetalles) {
      await localPrisma.ventaDetalle.create({ data: vd });
    }

    for (const f of fiados) {
      await localPrisma.fiado.create({ data: f });
    }

    for (const comp of compras) {
      await localPrisma.compra.create({ data: comp });
    }

    for (const cd of compraDetalles) {
      await localPrisma.compraDetalle.create({ data: cd });
    }

    for (const m of movimientos) {
      await localPrisma.movimientoInventario.create({ data: m });
    }

    console.log('\n🎉 ¡Copia completada con éxito!');
    console.log('✅ Tu PostgreSQL local ahora tiene los datos reales de Supabase.');
    console.log('🛡️ Supabase NO fue alterado (Solo se leyó).');
    console.log('🔑 Todas las cuentas locales se configuraron con contraseña/PIN: 060266');

  } catch (err) {
    console.error('❌ Error durante la sincronización:', err);
  } finally {
    await supabasePrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

syncFromSupabase();
