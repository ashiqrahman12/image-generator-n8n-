import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Increase for video uploads
    },
  },
};

export default nextConfig;
