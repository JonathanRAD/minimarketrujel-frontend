import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${env.port}`);
  console.log(`   Entorno: ${env.nodeEnv}`);
});
