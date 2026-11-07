import type { MetadataRoute } from "next";
import {
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/seo/site-identity";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    // manifest는 CSS 변수를 읽지 못해 색을 직접 쓴다. theme_color는 app/globals.css의 --color-sea-600과 같은 값이다.
    background_color: "#ffffff",
    theme_color: "#0b6b88",
    lang: "ko-KR",
    // 안드로이드 홈 화면 아이콘. 탭 파비콘(산과 바다만)과 달리 그림 전체를 쓴다.
    // maskable은 기기가 원·둥근 사각형으로 잘라도 그림이 남도록 가운데에 여백을 크게 둔 판이다(2026-11-07).
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: SITE_LOGO_PATH, sizes: "512x512", type: "image/jpeg", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
