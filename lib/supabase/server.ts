import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/config/env";

export function createPublicSupabaseClient() {
  const env = getPublicEnv();
  if (env.NEXT_PUBLIC_DATA_MODE !== "supabase") return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
