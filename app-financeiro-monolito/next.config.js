/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
