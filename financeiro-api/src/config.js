const DEFAULT_PORT = 3001;
const DEFAULT_TIMEOUT_MS = 15_000;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOrigins(value) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function parseUrl(value, name) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} deve ser uma URL absoluta válida.`);
  }
}

function parseDatabaseUrl(value) {
  if (!value) return '';
  const url = parseUrl(value, 'DATABASE_URL');
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL deve usar o protocolo postgres:// ou postgresql://.');
  }
  return value;
}

export function loadConfig(env = process.env) {
  return {
    port: parsePositiveInt(env.PORT, DEFAULT_PORT),
    databaseUrl: parseDatabaseUrl(env.DATABASE_URL),
    corsOrigins: parseOrigins(env.CORS_ORIGINS),
    auth: {
      passwordHash: env.AUTH_PASSWORD_HASH ?? '',
      jwtSecret: env.JWT_SECRET ?? '',
      jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
      username: env.AUTH_USER || 'admin',
    },
  };
}
import 'dotenv/config';
