/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Transpile workspace packages (required for monorepos)
  transpilePackages: ['@ai-chat/shared'],
};

export default nextConfig;
