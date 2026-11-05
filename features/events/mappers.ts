import type { Tables } from "@/lib/supabase/database.types";
import type {
  Event,
  EventAudience,
  EventOccurrence,
  EventScheduleMode,
} from "@/features/events/model/event";

type OccurrenceRow = Pick<Tables<"event_occurrences">, "id" | "starts_at" | "ends_at">;

/** 공개 조회 select("*, event_occurrences(id, starts_at, ends_at)")의 행 모양. */
export type PublicEventRow = Tables<"events"> & { event_occurrences?: OccurrenceRow[] | null };

/**
 * DB 행(snake_case)을 화면에서 쓰는 Event(camelCase)로 바꾼다.
 * 공개 행사는 DB 제약(events_published_fields)상 시작일이 반드시 있다.
 * 그래도 시작일이 없는 행이 오면 화면 전체를 깨뜨리지 않도록 null을 돌려 목록에서 뺀다.
 */
export function mapPublicEventRow(row: PublicEventRow): Event | null {
  if (!row.event_start_at) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    category: row.category,
    // DB check 제약(events_audiences)이 허용 값만 저장하게 막는다.
    audiences: row.audiences as EventAudience[],
    eventStartAt: row.event_start_at,
    eventEndAt: row.event_end_at,
    operatingHours: row.operating_hours,
    scheduleMode: scheduleMode(row.schedule_mode),
    occurrences: occurrences(row.event_occurrences ?? []),
    applicationStartAt: row.application_start_at,
    applicationEndAt: row.application_end_at,
    locationName: row.location_name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    locationSourceUrl: row.location_source_url,
    locationVerifiedAt: row.location_verified_at,
    priceText: row.price_text,
    isFree: row.is_free,
    performers: [
      ...trimmed(row.performer_people).map((name) => ({ name, type: "Person" as const })),
      ...trimmed(row.performer_groups).map((name) => ({ name, type: "PerformingGroup" as const })),
    ],
    organizer: row.organizer,
    organizerUrl: row.organizer_url,
    contact: row.contact,
    officialUrl: row.official_url,
    applicationUrl: row.application_url,
    imageUrl: row.image_url,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    reviewStatus: row.review_status,
    isFeatured: row.is_featured,
    viewCount: row.view_count,
    lastVerifiedAt: row.last_verified_at,
    publishedAt: row.published_at,
  };
}

function trimmed(values: string[]) {
  return values.map((item) => item.trim()).filter(Boolean);
}

function scheduleMode(value: string): EventScheduleMode {
  return value === "occurrences" ? "occurrences" : "continuous";
}

function occurrences(rows: OccurrenceRow[]): EventOccurrence[] {
  return rows
    .map((row) => ({ id: row.id, startsAt: row.starts_at, endsAt: row.ends_at }))
    .filter((occurrence) => !Number.isNaN(new Date(occurrence.startsAt).getTime()))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || (a.endsAt ?? "").localeCompare(b.endsAt ?? ""));
}
