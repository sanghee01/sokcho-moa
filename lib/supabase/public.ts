import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 세션 없이 publishable key로 만든 client. DB에서 항상 anon으로 동작한다.
 * 캐시 함수 안에서는 쿠키를 읽을 수 없으므로, 캐시되는 공개 조회는 이 client를 쓴다.
 */
export function createPublicSupabaseClient() {
  const env = getPublicEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
