import type { EventCandidate } from "@/lib/domain/event";
import { canonicalizeSourceUrl } from "@/lib/domain/source";

export function buildCandidateEventPayload(candidate: EventCandidate, slug: string) {
  return {
    slug,
    title: candidate.title,
    summary: candidate.summary || candidate.description || null,
    category: candidate.category ?? "other",
    audiences: candidate.audiences,
    event_start_at: candidate.eventStartAt,
    event_end_at: candidate.eventEndAt,
    operating_hours: candidate.operatingHours,
    application_start_at: candidate.applicationStartAt,
    application_end_at: candidate.applicationEndAt,
    location_name: candidate.locationName,
    address: candidate.address,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    price_text: candidate.priceText,
    is_free: candidate.isFree,
    organizer: candidate.organizer,
    contact: candidate.contact,
    official_url: candidate.officialUrl,
    application_url: candidate.applicationUrl,
    image_url: candidate.imageUrl,
    source_name: candidate.sourceName,
    source_url: canonicalizeSourceUrl(candidate.sourceUrl),
    last_verified_at: null,
  };
}
