/**
 * env.js — Carregamento e validação das variáveis de ambiente.
 * Falha explicitamente na inicialização se alguma variável obrigatória faltar.
 */

const REQUIRED_VARS = ['AUTH_USER', 'AUTH_PASSWORD', 'JWT_SECRET'];

REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Variável de ambiente obrigatória ausente: ${key}`);
    console.error(`   Crie o arquivo .env baseado no .env.example`);
    process.exit(1);
  }
});

module.exports = {
  PORT:           process.env.PORT          || '3001',
  AUTH_USER:      process.env.AUTH_USER,
  AUTH_PASSWORD:  process.env.AUTH_PASSWORD,
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  FRONTEND_URL:   process.env.FRONTEND_URL   || 'http://localhost:5173',
  NODE_ENV:       process.env.NODE_ENV       || 'development',
};
