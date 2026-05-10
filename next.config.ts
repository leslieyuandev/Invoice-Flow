import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // enables minimal Docker image via Dockerfile
  images: {
    remotePatterns: [
      // Allow logo images from Cloudflare R2 or S3
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" }, // accommodate logo uploads
  },
};

export default nextConfig;
