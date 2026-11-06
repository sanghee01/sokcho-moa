import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

export async function getAdminPlaces() {
  const client = await createSessionSupabaseClient();
  const { data, error } = await client.from("places").select("*").order("name");
  if (error) throw new Error(`명소 목록을 불러오지 못했습니다: ${error.message}`);
  return data ?? [];
}

export async function getAdminPlace(id: string) {
  if (!isUuid(id)) return null;
  const client = await createSessionSupabaseClient();
  const { data, error } = await client.from("places").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`명소를 불러오지 못했습니다: ${error.message}`);
  return data;
}
