import { PrismaClient } from '@prisma/client';

// URLs de conexión
const LOCAL_DB_URL = 'postgresql://postgres:123456@localhost:5432/minimarketrujel?schema=public';
const SUPABASE_DB_URL = process.env.DATABASE_URL;

if (!SUPABASE_DB_URL) {
  console.error('Error: La variable DATABASE_URL no está definida en el entorno.');
  process.exit(1);
}

// Inicializar clientes de Prisma
const localPrisma = new PrismaClient({
  datasources: {
    db: { url: LOCAL_DB_URL },
  },
});

const supabasePrisma = new PrismaClient({
  datasources: {
    db: { url: SUPABASE_DB_URL + (SUPABASE_DB_URL.includes('?') ? '&' : '?') + 'connection_limit=1' },
  },
});

async function main() {
  console.log('=== Iniciando migración de catálogo local a Supabase ===');

  try {
    // 1. Extraer datos locales
    console.log('\n1. Extrayendo datos de la base de datos local...');
    
    const usuarios = await localPrisma.usuario.findMany();
    console.log(`- Usuarios encontrados: ${usuarios.length}`);

    const categorias = await localPrisma.categoria.findMany();
    console.log(`- Categorías encontradas: ${categorias.length}`);

    const proveedores = await localPrisma.proveedor.findMany();
    console.log(`- Proveedores encontrados: ${proveedores.length}`);

    const clientes = await localPrisma.cliente.findMany();
    console.log(`- Clientes encontrados: ${clientes.length}`);

    const productos = await localPrisma.producto.findMany();
    console.log(`- Productos encontrados: ${productos.length}`);

    // 2. Limpiar tablas transaccionales y de catálogo en Supabase
    console.log('\n2. Limpiando tablas de destino en Supabase (evitar duplicados)...');
    
    // Primero tablas hijas para evitar violaciones de clave foránea
    await supabasePrisma.movimientoInventario.deleteMany({});
    await supabasePrisma.compraDetalle.deleteMany({});
    await supabasePrisma.compra.deleteMany({});
    await supabasePrisma.fiado.deleteMany({});
    await supabasePrisma.ventaDetalle.deleteMany({});
    await supabasePrisma.venta.deleteMany({});
    await supabasePrisma.turnoCaja.deleteMany({});
    
    // Ahora las tablas principales
    await supabasePrisma.producto.deleteMany({});
    await supabasePrisma.categoria.deleteMany({});
    await supabasePrisma.proveedor.deleteMany({});
    await supabasePrisma.cliente.deleteMany({});
    await supabasePrisma.usuario.deleteMany({});
    console.log('✔ Tablas en Supabase limpiadas con éxito.');

    // 3. Insertar datos en Supabase
    console.log('\n3. Insertando catálogo limpio en Supabase...');

    // A. Usuarios
    if (usuarios.length > 0) {
      await supabasePrisma.usuario.createMany({ data: usuarios });
      console.log(`✔ ${usuarios.length} Usuarios migrados.`);
    }

    // B. Categorías
    if (categorias.length > 0) {
      await supabasePrisma.categoria.createMany({ data: categorias });
      console.log(`✔ ${categorias.length} Categorías migradas.`);
    }

    // C. Proveedores
    if (proveedores.length > 0) {
      await supabasePrisma.proveedor.createMany({ data: proveedores });
      console.log(`✔ ${proveedores.length} Proveedores migrados.`);
    }

    // D. Clientes
    if (clientes.length > 0) {
      await supabasePrisma.cliente.createMany({ data: clientes });
      console.log(`✔ ${clientes.length} Clientes migrados.`);
    }

    // E. Productos
    if (productos.length > 0) {
      // Convertir campos Decimal si es necesario (Prisma lo maneja directamente)
      await supabasePrisma.producto.createMany({ data: productos });
      console.log(`✔ ${productos.length} Productos migrados.`);
    }

    console.log('\n=== ¡Migración completada con éxito! ===');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
}

main();
