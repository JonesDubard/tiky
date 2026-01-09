/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows images from all domains (adjust as needed)
      },
    ],
  },
  
  // Webpack configuration for Prisma
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Prisma Client from the server bundle
      config.externals.push('@prisma/client')
    }
    return config
  },
  
  // Environment variables that should be available at build time
  env: {
    // Add any environment variables you need here
  }
}

export default nextConfig