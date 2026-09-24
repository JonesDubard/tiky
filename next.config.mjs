/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [320, 420, 640, 750, 828],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  typescript: {
      // Temporarily ignore type errors during development
    ignoreBuildErrors: true,
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [
      // Portal callback URL is the site origin only. Orange appends /notifications.
      // Subscription probes go to {callbackUrl}/orangeMoneyProvTest.
      {
        source: '/notifications',
        destination: '/api/webhooks/orange-money',
      },
      // Orange Money Business API notification endpoint.
      {
        source: '/orangeMoneyProvTest',
        destination: '/api/webhooks/orange-money/orangeMoneyProvTest',
      },
      {
        source: '/mandates/activation/notifications',
        destination:
          '/api/webhooks/orange-money/mandates/activation/notifications',
      },
    ];
  },
  async headers() {
    const noStore = [{ key: 'Cache-Control', value: 'no-store' }];
    return [
      {
        source: '/((?!notifications|orangeMoneyProvTest|mandates|api/webhooks/orange-money).*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
      {
        source: '/notifications',
        headers: noStore,
      },
      {
        source: '/orangeMoneyProvTest',
        headers: noStore,
      },
      {
        source: '/mandates/:path*',
        headers: noStore,
      },
      {
        source: '/api/webhooks/orange-money',
        headers: noStore,
      },
      {
        source: '/api/webhooks/orange-money/:path*',
        headers: noStore,
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, immutable' }],
      },
    ];
  },
};

export default nextConfig;
