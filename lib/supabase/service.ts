import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicEnv } from "@/lib/config/env";

export function isServiceRoleSupabaseConfigured() {
  const env = getPublicEnv();
  return env.NEXT_PUBLIC_DATA_MODE === "supabase" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createServiceRoleSupabaseClient() {
  const env = getPublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (env.NEXT_PUBLIC_DATA_MODE !== "supabase" || !serviceRoleKey) return null;

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const getCachedSiteFeedbackImageUploadAvailability = unstable_cache(async () => {
  const client = createServiceRoleSupabaseClient();
  if (!client) return false;

  const [bucket, column] = await Promise.all([
    client.storage.getBucket("feedback-images"),
    client.from("site_feedback").select("image_path").limit(0),
  ]);
  return !bucket.error && !column.error;
}, ["site-feedback-image-upload-availability"], { revalidate: 300 });

export function isSiteFeedbackImageUploadAvailable() {
  return getCachedSiteFeedbackImageUploadAvailability();
}
