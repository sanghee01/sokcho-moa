import type {
  Event,
  EventAudience,
  EventCategory,
  EventOccurrence,
  EventScheduleMode,
  Place,
  ReviewStatus,
} from "@/lib/domain/event";

export function mapEventRow(row: Record<string, unknown>): Event {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: nullableString(row.summary),
    description: nullableString(row.description),
    category: row.category as EventCategory,
    audiences: (row.audiences ?? []) as EventAudience[],
    eventStartAt: String(row.event_start_at),
    eventEndAt: nullableString(row.event_end_at),
    operatingHours: nullableString(row.operating_hours),
    scheduleMode: scheduleMode(row.schedule_mode),
    occurrences: occurrenceRows(row.event_occurrences),
    applicationStartAt: nullableString(row.application_start_at),
    applicationEndAt: nullableString(row.application_end_at),
    locationName: nullableString(row.location_name),
    address: nullableString(row.address),
    latitude: nullableNumber(row.latitude),
    longitude: nullableNumber(row.longitude),
    locationSourceUrl: nullableString(row.location_source_url),
    locationVerifiedAt: nullableString(row.location_verified_at),
    priceText: nullableString(row.price_text),
    isFree: typeof row.is_free === "boolean" ? row.is_free : null,
    organizer: nullableString(row.organizer),
    contact: nullableString(row.contact),
    officialUrl: nullableString(row.official_url),
    applicationUrl: nullableString(row.application_url),
    imageUrl: nullableString(row.image_url),
    sourceName: String(row.source_name),
    sourceUrl: String(row.source_url),
    reviewStatus: row.review_status as ReviewStatus,
    isFeatured: Boolean(row.is_featured),
    isDemo: Boolean(row.is_demo),
    lastVerifiedAt: nullableString(row.last_verified_at),
    publishedAt: nullableString(row.published_at),
  };
}

export function mapPlaceRow(row: Record<string, unknown>): Place {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category),
    summary: nullableString(row.summary),
    address: nullableString(row.address),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    imageUrl: nullableString(row.image_url),
    officialUrl: nullableString(row.official_url),
    mapUrl: nullableString(row.map_url),
    isPublished: Boolean(row.is_published),
  };
}

function nullableString(value: unknown) {
  return value == null ? null : String(value);
}

function nullableNumber(value: unknown) {
  return value == null ? null : Number(value);
}

function scheduleMode(value: unknown): EventScheduleMode {
  return value === "occurrences" ? "occurrences" : "continuous";
}

function occurrenceRows(value: unknown): EventOccurrence[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is Record<string, unknown> => row != null && typeof row === "object")
    .map((row) => ({
      id: String(row.id),
      startsAt: String(row.starts_at),
      endsAt: nullableString(row.ends_at),
    }))
    .filter((occurrence) => !Number.isNaN(new Date(occurrence.startsAt).getTime()))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || (a.endsAt ?? "").localeCompare(b.endsAt ?? ""));
}
