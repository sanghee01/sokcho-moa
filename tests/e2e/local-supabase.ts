import { execSync } from "node:child_process";

/**
 * E2E는 로컬 Supabase(`pnpm db:start`)에만 접속한다. 키는 `supabase status`에서 읽어 하드코딩하지 않는다.
 * 주소가 로컬이 아니면 실행을 멈춰, 실수로 운영 DB에 테스트 데이터를 쓰지 않게 한다(dubinc/dub의 assert-local-database와 같은 목적).
 */
export function readLocalSupabaseEnv() {
  let status: Record<string, string>;
  try {
    status = JSON.parse(execSync("pnpm exec supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString());
  } catch {
    throw new Error("로컬 Supabase가 실행 중이 아닙니다. `pnpm db:start`와 `pnpm db:reset`을 먼저 실행하세요.");
  }

  const url = new URL(status.API_URL);
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error(`E2E는 로컬 Supabase에서만 실행합니다. 현재 주소: ${url.origin}`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY,
  };
}
