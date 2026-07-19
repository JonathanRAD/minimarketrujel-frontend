import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:4200').split(','),
  gmail: {
    userEmail: process.env.GMAIL_USER_EMAIL,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    adminRecipient: process.env.GMAIL_ADMIN_RECIPIENT,
  },
};
