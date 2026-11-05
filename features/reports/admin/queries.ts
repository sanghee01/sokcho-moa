import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

export async function getAdminEventReports() {
  const client = await createSessionSupabaseClient();
  const { data, error } = await client
    .from("event_reports")
    .select("id, title, body, source_url, review_status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`제보 목록을 불러오지 못했습니다: ${error.message}`);
  return data ?? [];
}
