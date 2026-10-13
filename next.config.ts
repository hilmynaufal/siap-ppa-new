import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Laporan boleh membawa 6 berkas x 5 MB (30 MB) ditambah isian formulir; batas bawaan Server Action hanya 1 MB.
    // Bila ada proxy di depan aplikasi (mis. Nginx), batas ukuran request-nya perlu setara.
    serverActions: { bodySizeLimit: "32mb" },
  },
};

export default nextConfig;
