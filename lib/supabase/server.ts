import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 요청의 로그인 쿠키로 만든 client. 로그인했으면 DB에서 authenticated로 동작하고,
 * 권한은 RLS와 is_admin()이 검사한다. 요청마다 새로 만든다(전역에 두지 않는다).
 */
export async function createSessionSupabaseClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component 렌더 중에는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts가 맡는다.
        }
      },
    },
  });
}

export type SessionSupabaseClient = Awaited<ReturnType<typeof createSessionSupabaseClient>>;
