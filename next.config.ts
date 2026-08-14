import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp uses platform-specific native packages. Next's file tracing can
  // otherwise omit libvips from the Vercel function bundle.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  experimental: {
    // Vercel의 4.5MB 요청 상한 안에서 3MB 이미지와 multipart 메타데이터를 받는다.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
