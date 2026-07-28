import type { Event } from "@/lib/domain/event";
import { deriveEventState } from "@/lib/domain/event";

type EventStructuredData = Record<string, unknown>;

export function buildEventStructuredData(
  event: Event,
  siteUrl: string,
  now = new Date(),
): EventStructuredData {
  const eventUrl = absoluteUrl(`/events/${encodeURIComponent(event.slug)}`, siteUrl);
  const offerPrice = eventOfferPrice(event);
  const performers = (event.performers ?? []).map((performer) => ({
    "@type": performer.type,
    name: performer.name,
  }));
  const organizerUrl = event.organizerUrl ?? (event.organizer ? urlOrigin(event.sourceUrl) : undefined);

  return compactObject({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary ?? event.description,
    startDate: event.eventStartAt,
    endDate: event.eventEndAt ?? event.eventStartAt,
    eventStatus: deriveEventState(event, now) === "ended"
      ? "https://schema.org/EventCompleted"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: event.isFree ?? undefined,
    location: event.locationName
      ? compactObject({
          "@type": "Place",
          name: event.locationName,
          address: event.address
            ? {
                "@type": "PostalAddress",
                streetAddress: event.address,
                addressCountry: "KR",
              }
            : undefined,
          geo: event.latitude != null && event.longitude != null
            ? {
                "@type": "GeoCoordinates",
                latitude: event.latitude,
                longitude: event.longitude,
              }
            : undefined,
        })
      : undefined,
    image: event.imageUrl ? [absoluteUrl(event.imageUrl, siteUrl)] : undefined,
    offers: offerPrice == null
      ? undefined
      : compactObject({
          "@type": "Offer",
          url: event.applicationUrl ?? event.sourceUrl,
          price: offerPrice,
          priceCurrency: "KRW",
          validFrom: event.applicationStartAt ?? undefined,
        }),
    performer: performers.length > 0 ? performers : undefined,
    organizer: event.organizer
      ? compactObject({
          "@type": "Organization",
          name: event.organizer,
          url: organizerUrl,
        })
      : undefined,
    url: eventUrl,
  });
}

export function eventOfferPrice(event: Pick<Event, "isFree" | "priceText">) {
  if (event.isFree === true) return 0;
  if (!event.priceText) return null;
  if (event.isFree !== false && /(?:^|\s)무료(?:\s|$|\(|,)/.test(event.priceText)) return 0;

  const prices = Array.from(event.priceText.matchAll(/(\d[\d,]*)\s*원/g))
    .map((match) => Number(match[1].replaceAll(",", "")))
    .filter((price) => Number.isFinite(price));
  return prices.length > 0 ? Math.min(...prices) : null;
}

function absoluteUrl(value: string, siteUrl: string) {
  return new URL(value, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function urlOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""),
  );
}
