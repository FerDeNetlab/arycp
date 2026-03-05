import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
