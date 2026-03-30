import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: '50mb',
  },
  serverExternalPackages: ['@genkit-ai/google-ai'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
