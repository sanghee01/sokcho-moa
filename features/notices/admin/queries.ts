import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

export async function getAdminNotices() {
  const client = await createSessionSupabaseClient();
  const { data, error } = await client.from("notices").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`공지 목록을 불러오지 못했습니다: ${error.message}`);
  return data ?? [];
}

export async function getAdminNotice(id: string) {
  if (!isUuid(id)) return null;
  const client = await createSessionSupabaseClient();
  const { data, error } = await client.from("notices").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`공지를 불러오지 못했습니다: ${error.message}`);
  return data;
}
