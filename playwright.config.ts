import { defineConfig, devices } from "@playwright/test";
import { readLocalSupabaseEnv } from "./tests/e2e/local-supabase";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // 요청 제한은 Vercel이 넣어 주는 방문자 IP 헤더만 믿는다. 로컬 production 서버에서도 같은 경로로 검증하고,
    // 두 브라우저 설정이 서로의 요청 한도를 쓰지 않도록 IP를 나눈다.
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], extraHTTPHeaders: { "x-vercel-forwarded-for": "127.0.0.1" } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], extraHTTPHeaders: { "x-vercel-forwarded-for": "127.0.0.2" } },
    },
  ],
  webServer: {
    // Next.js 문서 권장대로 개발 서버가 아니라 production build로 검증한다. 캐시·정적 생성 동작이 운영과 같다.
    command: `pnpm build && VERCEL=1 pnpm start -H 127.0.0.1 -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      ...readLocalSupabaseEnv(),
      NEXT_PUBLIC_SITE_URL: baseURL,
      SUBMISSION_RATE_LIMIT_HMAC_SECRET: "e2e-rate-limit-secret-for-local-tests-only",
      // 지도 탭이 지도 스크립트를 넣도록 가짜 Client ID로 빌드한다. 네이버로 가는 요청은 E2E가 가짜 SDK로 바꿔 끼운다
      // (tests/e2e/naver-maps-stub.ts). .env.local의 실제 키보다 이 값이 먼저다(2026-11-16 사용자 결정).
      NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: "e2e-fake-client-id",
    },
  },
});
