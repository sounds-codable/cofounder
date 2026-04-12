import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const shouldUseStaticExport = process.env.NODE_ENV === 'production';
const devApiProxyTarget = process.env.NEXT_PUBLIC_API_PROXY_TARGET || 'http://localhost:3010';
const devOnlyConfig: NextConfig = shouldUseStaticExport
  ? {}
  : {
      async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: `${devApiProxyTarget}/api/:path*`,
          },
        ];
      },
    };

const nextConfig: NextConfig = {
  ...(shouldUseStaticExport ? { output: 'export' as const } : {}),
  ...devOnlyConfig,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: rootDirectory,
  },
};

export default nextConfig;
