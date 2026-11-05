import type { EventFormValues } from "@/features/events/admin/schemas";
import { canonicalizeSourceUrl } from "@/features/events/model/source-url";

export function createEventSlug(randomId = crypto.randomUUID()) {
  return `event-${randomId.toLowerCase()}`;
}

/** 관리자 폼 값을 저장 RPC(create/update_event_with_source)가 받는 DB 컬럼 이름으로 바꾼다. */
export function buildEventPayload(event: EventFormValues, verifiedAt: string) {
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
  };
}

export function eventSavedRedirect(isEditing: boolean) {
  return `/admin?saved=${isEditing ? "event-updated" : "event-created"}`;
}
