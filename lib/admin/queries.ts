import "server-only";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

export async function getAdminEvents(status?: string) {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return [];
  let query = client.from("events").select("*").order("updated_at", { ascending: false });
  if (status && ["pending", "published", "rejected"].includes(status)) query = query.eq("review_status", status);
  const { data, error } = await query;
  if (error) throw new Error(`관리자 행사 목록을 불러오지 못했습니다: ${error.message}`);
  return data ?? [];
}

export async function getAdminEvent(id: string) {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`행사를 불러오지 못했습니다: ${error.message}`);
  return data;
}

export async function getAdminPlaces() {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("places").select("*").order("name");
  if (error) throw new Error(`명소 목록을 불러오지 못했습니다: ${error.message}`);
  return data ?? [];
}

export async function getAdminPlace(id: string) {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("places").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`명소를 불러오지 못했습니다: ${error.message}`);
  return data;
}
