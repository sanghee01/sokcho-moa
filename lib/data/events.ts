import { unstable_cache } from "next/cache";
import { getPublicEnv } from "@/lib/config/env";
import { filterEvents, type Event, type EventFilters, type Place } from "@/lib/domain/event";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { PUBLIC_EVENTS_CACHE_TAG, PUBLIC_PLACES_CACHE_TAG } from "./cache-tags";
import { demoPlaces, getDemoEvents } from "./demo-data";
import { mapEventRow, mapPlaceRow } from "./mappers";

const getCachedPublicEvents = unstable_cache(async (): Promise<Event[]> => {
  const client = createPublicSupabaseClient();
  if (!client) return [];
  const result = await client
    .from("events")
    .select("*, event_occurrences(id, starts_at, ends_at)")
    .eq("review_status", "published")
    .order("event_start_at", { ascending: true });
  const fallback = result.error && isMissingOccurrenceRelation(result.error.message)
    ? await client
      .from("events")
      .select("*")
      .eq("review_status", "published")
      .order("event_start_at", { ascending: true })
    : null;
  const { data, error } = fallback ?? result;
  if (error) throw new Error(`공개 행사 데이터를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map((row) => mapEventRow(row as Record<string, unknown>));
}, ["published-events"], { revalidate: 300, tags: [PUBLIC_EVENTS_CACHE_TAG] });

function isMissingOccurrenceRelation(message: string) {
  return message.includes("event_occurrences")
    && (message.includes("relationship") || message.includes("schema cache"));
}

const getCachedPublicPlaces = unstable_cache(async (): Promise<Place[]> => {
  const client = createPublicSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("places").select("*").eq("is_published", true).order("name");
  if (error) throw new Error(`주변 명소 데이터를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map((row) => mapPlaceRow(row as Record<string, unknown>));
}, ["published-places"], { revalidate: 300, tags: [PUBLIC_PLACES_CACHE_TAG] });

export async function getAllPublicEvents(): Promise<Event[]> {
  if (getPublicEnv().NEXT_PUBLIC_DATA_MODE === "demo") return getDemoEvents();
  return getCachedPublicEvents();
}

export async function getPublicEvents(filters: EventFilters, now = new Date()) {
  return filterEvents(await getAllPublicEvents(), filters, now);
}

export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
  return (await getAllPublicEvents()).find((event) => event.slug === slug) ?? null;
}

export async function getPublicPlaces(): Promise<Place[]> {
  if (getPublicEnv().NEXT_PUBLIC_DATA_MODE === "demo") return demoPlaces;
  return getCachedPublicPlaces();
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
