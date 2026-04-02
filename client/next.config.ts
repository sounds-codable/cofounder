import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const shouldUseStaticExport = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  ...(shouldUseStaticExport ? { output: 'export' as const } : {}),
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: rootDirectory,
  },
};

export default nextConfig;
