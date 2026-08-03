import type { EventFormValues } from "@/lib/admin/schemas";
import { canonicalizeSourceUrl, extractSourceExternalId } from "@/lib/domain/source";

export function createEventSlug(randomId = crypto.randomUUID()) {
  return `event-${randomId.toLowerCase()}`;
}

export function buildEventPayload(event: EventFormValues, verifiedAt: string) {
  const legacyOfficialUrl = (event as EventFormValues & { officialUrl?: string | null }).officialUrl;
  const sourceUrl = canonicalizeSourceUrl(event.sourceUrl);
  return {
    slug: event.slug,
    title: event.title,
    summary: event.introduction,
    category: event.category,
    audiences: event.audiences,
    event_start_at: event.eventStartAt,
    event_end_at: event.eventEndAt,
    operating_hours: event.operatingHours,
    schedule_mode: event.scheduleMode,
    application_start_at: event.applicationStartAt,
    application_end_at: event.applicationEndAt,
    location_name: event.locationName,
    address: event.address,
    price_text: event.priceText,
    is_free: event.isFree,
    performer_people: event.performerPeople,
    performer_groups: event.performerGroups,
    organizer: event.organizer,
    organizer_url: event.organizerUrl,
    contact: event.contact,
    application_url: event.applicationUrl,
    image_url: event.imageUrl,
    source_name: event.sourceName,
    source_url: sourceUrl,
    is_featured: event.isFeatured,
    last_verified_at: verifiedAt,
    ...(legacyOfficialUrl !== undefined ? { official_url: legacyOfficialUrl } : {}),
  };
}

export function buildEventSourcePayload(eventId: string, event: EventFormValues, verifiedAt: string) {
  const originalUrl = canonicalizeSourceUrl(event.sourceUrl);
  return {
    event_id: eventId,
    provider: event.sourceName,
    original_url: originalUrl,
    external_id: extractSourceExternalId(originalUrl),
    last_checked_at: verifiedAt,
  };
}

export function eventSavedRedirect(isEditing: boolean) {
  return `/admin?saved=${isEditing ? "event-updated" : "event-created"}`;
}
