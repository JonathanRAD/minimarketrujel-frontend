import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ==========================================
// 🛠️ CONFIGURA TUS NUEVAS CREDENCIALES AQUÍ:
// ==========================================
const EMAIL_A_BUSCAR = 'admin@minimarket.com'; // Email actual a actualizar
const NUEVO_EMAIL = 'admin@minimarket.com';     // Cambia si deseas otro email de login, o déjalo igual
const NUEVA_CONTRASEÑA = 'Elmaspro_123'; // Tu nueva contraseña secreta
const NUEVO_PIN = '060266';     // Tu nuevo PIN de 4 dígitos (ej: '7492')

async function main() {
  console.log('=== Actualizando credenciales en Supabase ===');

  if (
    NUEVA_CONTRASEÑA === 'Elmaspro_123' ||
    NUEVO_PIN === '060266'
  ) {
    console.error('\n❌ ERROR: Por favor, abre el archivo "backend/scripts/update-user.ts" y cambia los valores de NUEVA_CONTRASEÑA y NUEVO_PIN por los tuyos reales antes de ejecutar.');
    process.exit(1);
  }

  if (NUEVO_PIN.length !== 4 || isNaN(Number(NUEVO_PIN))) {
    console.error('\n❌ ERROR: El PIN debe tener exactamente 4 números.');
    process.exit(1);
  }

  // Encontrar usuario
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: EMAIL_A_BUSCAR },
  });

  if (!usuarioExistente) {
    console.error(`\n❌ ERROR: No se encontró ningún usuario con el email ${EMAIL_A_BUSCAR}`);
    process.exit(1);
  }

  // Generar hash bcrypt de la nueva contraseña
  const passwordHash = await bcrypt.hash(NUEVA_CONTRASEÑA, 10);

  // Actualizar en base de datos de Supabase
  const usuarioActualizado = await prisma.usuario.update({
    where: { email: EMAIL_A_BUSCAR },
    data: {
      email: NUEVO_EMAIL,
      passwordHash,
      pin: NUEVO_PIN,
    },
  });

  console.log(`\n✔ ¡Usuario "${usuarioActualizado.nombre}" actualizado con éxito en Supabase!`);
  console.log(`- Email de Acceso: ${usuarioActualizado.email}`);
  console.log(`- PIN de Acceso: ${usuarioActualizado.pin}`);
  console.log('\n=============================================');
}

main()
  .catch((e) => {
    console.error('❌ Error al actualizar el usuario:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
