import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 떠난 화면을 지우지 않고 React <Activity>로 숨겨 두었다가 돌아올 때 그대로 보여 준다. 상세에서 목록으로 돌아올 때
  // 목록을 새로 만들어 썸네일이 회색 칸으로 한 번 깜빡이던 것(iOS WebKit)을 없앤다(2026-11-24 사용자 결정).
  cacheComponents: true,
  // 링크가 미리 받는 범위는 지금처럼 둔다. true면 상세 링크가 공통 틀(App Shell)만 미리 받아 상세로 가는 이동이 느려진다(2026-11-24).
  partialPrefetching: false,
  outputFileTracingIncludes: {
    "/admin/events/**": [
      "./node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
    "/admin/import": [
      "./node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  experimental: {
    // Vercel의 4.5MB 요청 상한 안에서 3MB 이미지와 multipart 메타데이터를 받는다.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
