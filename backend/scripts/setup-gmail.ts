import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import * as readline from 'readline';

// Configuración de puertos y URI de redirección
const PORT = 3005;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log('\n======================================================');
  console.log('🤖 CONFIGURADOR DE GMAIL API - OAUTH2 PARA MINIMARKET');
  console.log('======================================================\n');

  const credentialsPath = path.join(__dirname, '../credentials.json');

  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ Error: No se encontró el archivo "credentials.json" en la carpeta backend/');
    console.log('\nInstrucciones para conseguirlo:');
    console.log('1. Entra a Google Cloud Console (https://console.cloud.google.com).');
    console.log('2. Crea un proyecto y habilita la API "Gmail API".');
    console.log('3. Ve a "OAuth consent screen" (Pantalla de consentimiento OAuth):');
    console.log('   - Configura el User Type como "External" (Externo).');
    console.log('   - Agrega tu correo de Gmail de pruebas en la sección "Test users" (Usuarios de prueba). (¡MUY IMPORTANTE!)');
    console.log('4. Ve a "Credentials" (Credenciales) -> "Create Credentials" -> "OAuth Client ID":');
    console.log('   - Tipo de aplicación: "Web application" (Aplicación web).');
    console.log('   - Nombre: Minimarket Email Service.');
    console.log('   - Authorized redirect URIs: Añade exatamente:');
    console.log(`     ${REDIRECT_URI}`);
    console.log('5. Haz clic en "Create" y descarga el archivo JSON de credenciales.');
    console.log(`6. Guárdalo como "credentials.json" en: \n   ${credentialsPath}\n`);
    rl.close();
    process.exit(1);
  }

  // Cargar credenciales
  let clientSecretData;
  try {
    const rawData = fs.readFileSync(credentialsPath, 'utf8');
    clientSecretData = JSON.parse(rawData);
  } catch (err) {
    console.error('❌ Error al parsear credentials.json. Asegúrate de que es un JSON válido.');
    rl.close();
    process.exit(1);
  }

  // Google descarga el JSON con la clave 'web' o 'installed'
  const config = clientSecretData.web || clientSecretData.installed;
  if (!config) {
    console.error('❌ Error: Formato de credentials.json no reconocido. Debe contener la clave "web" o "installed".');
    rl.close();
    process.exit(1);
  }

  const clientId = config.client_id;
  const clientSecret = config.client_secret;

  if (!clientId || !clientSecret) {
    console.error('❌ Error: credentials.json no contiene client_id o client_secret.');
    rl.close();
    process.exit(1);
  }

  console.log('✅ credentials.json cargado correctamente.');

  // Preguntar por el correo del administrador
  const adminRecipient = await question('✉️  Ingresa el correo electrónico del administrador (donde llegarán los comprobantes): ');
  if (!adminRecipient || !adminRecipient.includes('@')) {
    console.error('❌ Error: Correo no válido.');
    rl.close();
    process.exit(1);
  }

  // Generar URL de consentimiento
  const scopes = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/userinfo.email',
  ];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(
    scopes.join(' ')
  )}&access_type=offline&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&client_id=${clientId}&prompt=consent`;

  console.log('\n------------------------------------------------------');
  console.log('🔗 POR FAVOR, ABRE EL SIGUIENTE ENLACE EN TU NAVEGADOR');
  console.log('   Inicia sesión con la cuenta de Gmail desde la que se enviarán los correos');
  console.log('------------------------------------------------------\n');
  console.log(authUrl);
  console.log('\n------------------------------------------------------');
  console.log('⌛ Esperando autorización del usuario...');

  // Iniciar servidor temporal para capturar el código
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url || '', true);
      if (parsedUrl.pathname === '/oauth2callback') {
        const code = parsedUrl.query.code;

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>Error: No se recibió ningún código de autorización.</h1>');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>¡Autorización completada! Puedes cerrar esta pestaña y regresar a la terminal.</h1>');
        
        console.log('✅ Código de autorización recibido.');
        server.close();

        // Intercambiar código por tokens
        console.log('⌛ Solicitando tokens de Google...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code: code as string,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          throw new Error(`Error al obtener tokens: ${errText}`);
        }

        const tokens = await tokenResponse.json() as any;
        const accessToken = tokens.access_token;
        const refreshToken = tokens.refresh_token;

        if (!refreshToken) {
          console.log('⚠️  Advertencia: No se recibió un refresh_token.');
          console.log('Esto sucede si ya habías autorizado la aplicación antes.');
          console.log('Para solucionarlo:');
          console.log('1. Ve a https://myaccount.google.com/connections.');
          console.log('2. Busca tu aplicación y remueve sus accesos.');
          console.log('3. Vuelve a ejecutar este script.');
          rl.close();
          process.exit(1);
        }

        // Obtener el correo del usuario autorizado
        console.log('⌛ Obteniendo detalles de la cuenta de Gmail...');
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('No se pudo obtener la información de usuario de Google.');
        }

        const userInfo = await userInfoResponse.json() as any;
        const userEmail = userInfo.email;

        if (!userEmail) {
          throw new Error('No se pudo determinar el correo del usuario.');
        }

        console.log(`✅ Cuenta vinculada: ${userEmail}`);

        // Guardar todo en el archivo .env
        updateEnv({
          GMAIL_USER_EMAIL: userEmail,
          GMAIL_CLIENT_ID: clientId,
          GMAIL_CLIENT_SECRET: clientSecret,
          GMAIL_REFRESH_TOKEN: refreshToken,
          GMAIL_ADMIN_RECIPIENT: adminRecipient,
        });

        console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA CON ÉXITO! 🎉');
        console.log('Las credenciales han sido guardadas directamente en tu archivo .env:');
        console.log(`- GMAIL_USER_EMAIL="${userEmail}"`);
        console.log(`- GMAIL_CLIENT_ID="${clientId.substring(0, 15)}..."`);
        console.log(`- GMAIL_CLIENT_SECRET="********"`);
        console.log(`- GMAIL_REFRESH_TOKEN="********"`);
        console.log(`- GMAIL_ADMIN_RECIPIENT="${adminRecipient}"\n`);
        console.log('Ahora puedes usar la funcionalidad de correos de frente y sin complicaciones. 🚀');

        rl.close();
        process.exit(0);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    } catch (err: any) {
      console.error('❌ Ocurrió un error durante la autenticación:', err.message);
      server.close();
      rl.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    // Servidor activo
  });
}

function updateEnv(updates: Record<string, string>) {
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const lines = envContent.split(/\r?\n/);
  const updatedKeys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const eqIdx = line.indexOf('=');
      const key = line.slice(0, eqIdx).trim();
      if (updates[key] !== undefined) {
        lines[i] = `${key}="${updates[key]}"`;
        updatedKeys.add(key);
      }
    }
  }

  // Añadir variables que no existían
  for (const [key, val] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      lines.push(`${key}="${val}"`);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
}

main().catch((err) => {
  console.error('❌ Error inesperado:', err);
  rl.close();
  process.exit(1);
});
