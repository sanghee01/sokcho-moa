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
    // 코드가 migration(20261121050439)보다 먼저 배포되면 이 컬럼이 아직 없어 undefined가 온다. 그때도 행사 상세의 주변 명소가 죽지 않게 한다.
    tags: (row.tags ?? []).filter(isActivityTag),
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
    verifiedOn: row.verified_on,
  };
}
