import type { Tables } from "@/lib/supabase/database.types";
import { isActivityCategory, isActivityTag, isOperationStatus, parseCautions } from "@/features/places/model/activity";
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
    imageCredit: row.image_credit ?? null,
    imageSourceUrl: row.image_source_url ?? null,
    imageAlt: row.image_alt ?? null,
    officialUrl: row.official_url,
    mapUrl: row.map_url,
    isPublished: row.is_published,
    // 분류·태그·운영 상태는 DB check 제약이 값을 정해 두지만 생성 타입은 string이라 여기서 좁힌다.
    activityCategory: isActivityCategory(row.activity_category) ? row.activity_category : null,
    tags: row.tags.filter(isActivityTag),
    description: row.description,
    hoursSummary: row.hours_summary,
    closedSummary: row.closed_summary,
    priceSummary: row.price_summary,
    phone: row.phone,
    parkingSummary: row.parking_summary,
    cautions: parseCautions(row.cautions),
    bookingUrl: row.booking_url,
    operationStatus: isOperationStatus(row.operation_status) ? row.operation_status : "open",
    statusNote: row.status_note,
    statusNoteUntil: row.status_note_until,
    verifiedOn: row.verified_on,
  };
}
