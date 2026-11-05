import type { Tables } from "@/lib/supabase/database.types";
import type { Place } from "@/features/places/model/place";

export function mapPlaceRow(row: Tables<"places">): Place {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    summary: row.summary,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    imageUrl: row.image_url,
    officialUrl: row.official_url,
    mapUrl: row.map_url,
    isPublished: row.is_published,
  };
}
