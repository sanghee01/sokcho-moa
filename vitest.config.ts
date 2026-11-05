import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/unit/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // unit test는 DB에 접속하지 않는다. 필수 공개 환경 변수만 로컬 기본값으로 채운다.
    env: {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "unit-test-publishable-key",
    },
    include: ["tests/unit/**/*.test.ts"],
  },
});
