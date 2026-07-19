import { getPublicEnv } from "@/lib/config/env";
import { filterEvents, type Event, type EventFilters, type Place } from "@/lib/domain/event";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { demoPlaces, getDemoEvents } from "./demo-data";
import { mapEventRow, mapPlaceRow } from "./mappers";

export async function getAllPublicEvents(): Promise<Event[]> {
  if (getPublicEnv().NEXT_PUBLIC_DATA_MODE === "demo") return getDemoEvents();
  const client = createPublicSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("review_status", "published")
    .order("event_start_at", { ascending: true });
  if (error) throw new Error(`공개 행사 데이터를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map((row) => mapEventRow(row as Record<string, unknown>));
}

export async function getPublicEvents(filters: EventFilters, now = new Date()) {
  return filterEvents(await getAllPublicEvents(), filters, now);
}

export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
  if (getPublicEnv().NEXT_PUBLIC_DATA_MODE === "demo") {
    return getDemoEvents().find((event) => event.slug === slug && event.reviewStatus === "published") ?? null;
  }
  const client = createPublicSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("review_status", "published")
    .maybeSingle();
  if (error) throw new Error(`행사 상세를 불러오지 못했습니다: ${error.message}`);
  return data ? mapEventRow(data as Record<string, unknown>) : null;
}

export async function getPublicPlaces(): Promise<Place[]> {
  if (getPublicEnv().NEXT_PUBLIC_DATA_MODE === "demo") return demoPlaces;
  const client = createPublicSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("places").select("*").eq("is_published", true).order("name");
  if (error) throw new Error(`주변 명소 데이터를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map((row) => mapPlaceRow(row as Record<string, unknown>));
}

export function getRelatedEvents(current: Event, events: Event[], limit = 4) {
  const currentStart = new Date(current.eventStartAt).getTime();
  const currentEnd = new Date(current.eventEndAt ?? current.eventStartAt).getTime();
  return events
    .filter((event) => event.id !== current.id)
    .map((event) => {
      const start = new Date(event.eventStartAt).getTime();
      const end = new Date(event.eventEndAt ?? event.eventStartAt).getTime();
      const overlaps = start <= currentEnd && end >= currentStart;
      const sharesAudience = event.audiences.some((audience) => current.audiences.includes(audience));
      return { event, score: (overlaps ? 4 : 0) + (event.category === current.category ? 2 : 0) + (sharesAudience ? 1 : 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.event.eventStartAt.localeCompare(b.event.eventStartAt))
    .slice(0, limit)
    .map(({ event }) => event);
}
