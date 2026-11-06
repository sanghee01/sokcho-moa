import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { PUBLIC_EVENTS_CACHE_TAG } from "@/features/events/cache";
import { mapPublicEventRow } from "@/features/events/mappers";
import type { Event } from "@/features/events/model/event";

/**
 * 공개 행사 전체를 한 번에 불러와 5분 동안 캐시한다. 검색·필터·정렬은 메모리에서 한다.
 * 행사 수가 적어 조건별로 캐시를 나누면 적중률만 떨어진다. 배포가 바뀌어도 유지되는
 * unstable_cache를 쓴다(Next.js 16 문서: non-fetch 데이터를 배포 간 유지할 때 계속 사용 가능).
 */
const getCachedPublicEvents = unstable_cache(async (): Promise<Event[]> => {
  const client = createPublicSupabaseClient();
  const { data, error } = await client
    .from("events")
    .select("*, event_occurrences(id, starts_at, ends_at)")
    .eq("review_status", "published")
    .eq("is_demo", false)
    .order("event_start_at", { ascending: true });
  if (error) throw new Error(`공개 행사 데이터를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).flatMap((row) => mapPublicEventRow(row) ?? []);
}, ["published-events"], { revalidate: 300, tags: [PUBLIC_EVENTS_CACHE_TAG] });

export async function getAllPublicEvents(): Promise<Event[]> {
  return getCachedPublicEvents();
}

export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
  return (await getAllPublicEvents()).find((event) => event.slug === slug) ?? null;
}
