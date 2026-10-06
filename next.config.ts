import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Laporan boleh membawa 3 berkas x 5 MB; batas bawaan Server Action hanya 1 MB.
    serverActions: { bodySizeLimit: "16mb" },
  },
};

export default nextConfig;
