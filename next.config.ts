import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 5MB 이미지와 multipart 메타데이터가 함께 전달될 여유를 둔다.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
