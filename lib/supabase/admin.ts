import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseSecretKey } from "@/lib/env.server";

/**
 * secret key로 만든 client. DB에서 service_role로 동작해 RLS를 거치지 않는다.
 * 그래서 RLS 대신 서버 코드가 검증을 책임지는 곳(방문자 제보·의견 저장, 요청 제한)에서만 쓴다.
 * 설정이 없으면 null을 돌려주고, 호출한 기능이 "준비 중"으로 응답한다.
 */
export function createAdminSupabaseClient() {
  const env = getPublicEnv();
  const secretKey = getSupabaseSecretKey();
  if (!secretKey) return null;

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type AdminSupabaseClient = NonNullable<ReturnType<typeof createAdminSupabaseClient>>;
