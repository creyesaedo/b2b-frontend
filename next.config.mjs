import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (copies only what
  // dist needs into .next/standalone instead of shipping node_modules).
  output: 'standalone',
  // Google avatar + MercadoLibre image hosts.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
