import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb', // Allow video uploads up to 15MB
    },
  },
};

export default nextConfig;
