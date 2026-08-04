/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'bcryptjs', 'jsonwebtoken'],
};

module.exports = nextConfig;
