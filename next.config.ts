import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/adapter-neon",
    "@prisma/adapter-pg",
    "@neondatabase/serverless",
    "pg",
  ],
};

export default nextConfig;
