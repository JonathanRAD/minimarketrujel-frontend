import 'dotenv/config';
import { PrismaClient, UnidadMedida } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la carga de productos del catálogo de WhatsApp...');

  // 1. Crear las Categorías (o recuperarlas si ya existen)
  const categoriasNombres = [
    { nombre: 'Bebidas', descripcion: 'Gaseosas, jugos, aguas y bebidas hidratantes' },
    { nombre: 'Aseo personal', descripcion: 'Cuidado e higiene personal' },
    { nombre: 'Conservas', descripcion: 'Atún y alimentos enlatados' },
    { nombre: 'Lácteos', descripcion: 'Leche, yogur y derivados' },
    { nombre: 'Abarrotes', descripcion: 'Arroz, azúcar, aceites y condimentos' },
    { nombre: 'Limpieza & Aseo', descripcion: 'Productos de limpieza del hogar' }
  ];

  console.log('🏷️ Creando categorías...');
  const categoriasMap: Record<string, string> = {};

  for (const cat of categoriasNombres) {
    const createdCat = await prisma.categoria.upsert({
      where: { id: '' }, // No buscar por ID porque no lo tenemos, usamos create alternativo
      create: cat,
      update: cat,
    });
    // Como upsert requiere una condición única, mejor usamos findFirst/create
    let dbCat = await prisma.categoria.findFirst({
      where: { nombre: cat.nombre }
    });

    if (!dbCat) {
      dbCat = await prisma.categoria.create({ data: cat });
    }
    categoriasMap[cat.nombre] = dbCat.id;
  }

  // 2. Definición de los 33 productos de las capturas
  const productosData = [
    // --- Bebidas ---
    { nombre: 'Bebida Saludable - Kero Aloe PIÑA', precioVenta: 3.50, categoria: 'Bebidas', code: 'WA-KERO-PIN' },
    { nombre: 'Bebida Saludable - Kero Aloe UVA', precioVenta: 3.50, categoria: 'Bebidas', code: 'WA-KERO-UVA' },
    { nombre: 'Bebida Energizante - Sporade 500ML', precioVenta: 2.49, categoria: 'Bebidas', code: 'WA-SPO-500' },
    { nombre: 'Bebida Energizante - Sporade 1.5LT', precioVenta: 5.49, categoria: 'Bebidas', code: 'WA-SPO-1.5' },
    { nombre: 'Gaseosa Con Azucar - Inka Kola 3LT', precioVenta: 12.50, categoria: 'Bebidas', code: 'WA-INK-3L' },
    { nombre: 'Gaseosa Con Azucar - Inka Kola 600ML', precioVenta: 3.39, categoria: 'Bebidas', code: 'WA-INK-600' },
    { nombre: 'Inka Kola 1.5 Lt.', precioVenta: 7.50, categoria: 'Bebidas', code: 'WA-INK-1.5' },
    { nombre: 'Gaseosa Con Azucar - Coca Cola 3LT', precioVenta: 12.50, categoria: 'Bebidas', code: 'WA-CC-3L' },
    { nombre: 'Coca Cola 1.5 Lt.', precioVenta: 7.50, categoria: 'Bebidas', code: 'WA-CC-1.5' },
    { nombre: 'Gaseosa Con Azucar - Pepsi 3LT', precioVenta: 8.50, categoria: 'Bebidas', code: 'WA-PEPSI-3L' },
    { nombre: 'Gaseosa Con Azucar - Pepsi 750ML', precioVenta: 2.49, categoria: 'Bebidas', code: 'WA-PEPSI-750' },
    { nombre: 'Agua Mineral - San Carlos 3LT', precioVenta: 3.00, categoria: 'Bebidas', code: 'WA-SANCAR-3L' },
    { nombre: 'Agua Mineral - San Carlos 500ML', precioVenta: 0.99, categoria: 'Bebidas', code: 'WA-SANCAR-500' },
    { nombre: 'Agua Mineral - San Mateo 2.5LT', precioVenta: 3.99, categoria: 'Bebidas', code: 'WA-SANMAT-2.5' },

    // --- Aseo Personal ---
    { nombre: 'Cepillo Dental - Colgate PREMIER CLEAN', precioVenta: 2.99, categoria: 'Aseo personal', code: 'WA-CEP-COL' },
    { nombre: 'Cepillo Dental - Kolinos', precioVenta: 2.50, categoria: 'Aseo personal', code: 'WA-CEP-KOL' },
    { nombre: 'crema dental Doctor', precioVenta: 6.00, categoria: 'Aseo personal', code: 'WA-CREM-DOC' },
    { nombre: 'Crema Dental - Colgate 90gr', precioVenta: 3.99, categoria: 'Aseo personal', code: 'WA-CREM-COL90' },
    { nombre: 'Venditas', precioVenta: 0.20, categoria: 'Aseo personal', code: 'WA-VEN-IND' },

    // --- Conservas ---
    { nombre: 'Trozos De Atun - En Aceite - Florida 170g', precioVenta: 5.70, categoria: 'Conservas', code: 'WA-ATU-FLO' },
    { nombre: 'Filete De Atun - En Aceite - Campomar', precioVenta: 5.80, categoria: 'Conservas', code: 'WA-ATU-CAM' },
    { nombre: 'Grated De Atun - Marinero', precioVenta: 3.99, categoria: 'Conservas', code: 'WA-ATU-MAR' },
    { nombre: 'Filete De Atun - Gloria 140GR', precioVenta: 5.00, categoria: 'Conservas', code: 'WA-ATU-GLO' },

    // --- Lácteos ---
    { nombre: 'Leche evaporada Gloria', precioVenta: 4.19, categoria: 'Lácteos', code: 'WA-LEC-GLO' },
    { nombre: 'Leche evaporada sin Lactosa - Laive', precioVenta: 4.79, categoria: 'Lácteos', code: 'WA-LEC-LAI' },

    // --- Abarrotes ---
    { nombre: 'Aceite Deleite 900 ML.', precioVenta: 8.50, categoria: 'Abarrotes', code: 'WA-ACE-DEL' },
    { nombre: 'Azucar Rubia - San Jacinto', precioVenta: 3.50, categoria: 'Abarrotes', code: 'WA-AZU-JAC' },
    { nombre: 'Arroz - Faraon NARANJA - EXTRA AÑEJO', precioVenta: 4.80, categoria: 'Abarrotes', code: 'WA-ARR-FAR' },
    { nombre: 'Sillao - Ajinosillao 500ML', precioVenta: 5.49, categoria: 'Abarrotes', code: 'WA-SILL-AJI' },
    { nombre: 'Sillao - Kiko 160CC', precioVenta: 1.99, categoria: 'Abarrotes', code: 'WA-SILL-KIK' },

    // --- Limpieza & Aseo ---
    { nombre: 'Papel Higiénico - Noble PQ2 UND', precioVenta: 2.00, categoria: 'Limpieza & Aseo', code: 'WA-PAP-NOB2' },
    { nombre: 'Papel Higiénico - Noble PQ4 UND - 30 MT', precioVenta: 5.00, categoria: 'Limpieza & Aseo', code: 'WA-PAP-NOB4' },
    { nombre: 'Papel Toalla - Nova', precioVenta: 2.99, categoria: 'Limpieza & Aseo', code: 'WA-PAP-NOV' }
  ];

  console.log('📦 Creando productos...');
  let contador = 0;

  for (const prod of productosData) {
    const categoriaId = categoriasMap[prod.categoria];
    if (!categoriaId) continue;

    // Calcular un costo estimado (80% del precio de venta)
    const costo = Number((prod.precioVenta * 0.8).toFixed(2));

    // Revisar si ya existe el producto con ese código de barras
    const dbProd = await prisma.producto.findFirst({
      where: { codigoBarras: prod.code }
    });

    if (!dbProd) {
      await prisma.producto.create({
        data: {
          nombre: prod.nombre,
          codigoBarras: prod.code,
          precioVenta: prod.precioVenta,
          costo: costo,
          stockActual: 10.00, // Stock inicial por defecto
          stockMinimo: 3.00,
          unidadMedida: UnidadMedida.UNIDAD,
          categoriaId: categoriaId,
          activo: true
        }
      });
      contador++;
    }
  }

  console.log(`✅ Carga completada. Se crearon ${contador} productos.`);
}

main()
  .catch((e) => {
    console.error('❌ Error al cargar los productos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
