import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Transpile workspace packages (required for monorepos)
  transpilePackages: ['@ai-chat/shared'],
  // Tell Next.js where the monorepo root is for file tracing
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
