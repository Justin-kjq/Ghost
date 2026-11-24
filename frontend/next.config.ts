import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(frontendDir, ".."),
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/pitch-deck",
        destination: "/pitch-deck/index.html",
        permanent: false,
      },
      {
        source: "/pitch-deck/",
        destination: "/pitch-deck/index.html",
        permanent: false,
      },
      {
        source: "/brand-kit",
        destination: "/brand-kit/index.html",
        permanent: false,
      },
      {
        source: "/brand-kit/",
        destination: "/brand-kit/index.html",
        permanent: false,
      },
    ];
  },
  transpilePackages: [
    "@ghost/sdk",
    "@reown/appkit",
    "@reown/appkit-adapter-solana",
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      readline: false,
    };
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
