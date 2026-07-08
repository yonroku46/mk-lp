import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/price',
        destination: '/docs/price.pdf',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
