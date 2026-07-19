import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/config/env";

export async function createAuthenticatedSupabaseClient() {
  const env = getPublicEnv();
  if (env.NEXT_PUBLIC_DATA_MODE !== "supabase") return null;
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component 렌더 중에는 쿠키 쓰기가 허용되지 않는다. proxy가 세션을 갱신한다.
        }
      },
    },
  });
}
