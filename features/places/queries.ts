import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { PUBLIC_PLACES_CACHE_TAG } from "@/features/places/cache";
import { mapPlaceRow } from "@/features/places/mappers";
import type { Place } from "@/features/places/model/place";

const getCachedPublicPlaces = unstable_cache(async (): Promise<Place[]> => {
  const client = createPublicSupabaseClient();
  const { data, error } = await client.from("places").select("*").eq("is_published", true).order("name");
  if (error) throw new Error(`주변 명소 데이터를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map(mapPlaceRow);
}, ["published-places"], { revalidate: 300, tags: [PUBLIC_PLACES_CACHE_TAG] });

export async function getPublicPlaces(): Promise<Place[]> {
  return getCachedPublicPlaces();
}
