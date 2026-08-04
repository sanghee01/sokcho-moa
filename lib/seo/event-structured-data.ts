import type { Event } from "@/lib/domain/event";
import {
  deriveApplicationState,
  deriveEventState,
  getEventIntroduction,
} from "@/lib/domain/event";
import { categoryLabels, formatDateRange } from "@/lib/domain/format";
import { eventTopicPath } from "@/lib/domain/event-topic";

type EventStructuredData = Record<string, unknown>;

export function buildEventStructuredData(
  event: Event,
  siteUrl: string,
  now = new Date(),
): EventStructuredData | null {
  const locationAddress = event.address?.trim();
  if (!locationAddress) return null;

  const eventUrl = absoluteUrl(`/events/${encodeURIComponent(event.slug)}`, siteUrl);
  const eventId = `${eventUrl}#event`;
  const applicationUrl = cleanUrl(event.applicationUrl);
  const imageUrl = cleanUrl(event.imageUrl, true);
  const offer = applicationUrl ? buildEventOffer(event, applicationUrl, now) : undefined;
  const performers = (event.performers ?? []).map((performer) => ({
    "@type": performer.type,
    name: performer.name,
  }));
  const organizerUrl = cleanUrl(event.organizerUrl);

  return compactObject({
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": eventId,
    name: event.title,
    description: getEventIntroduction(event) ?? `${event.title}의 일정, 장소와 참여 정보를 확인하세요.`,
    startDate: event.eventStartAt,
    endDate: event.eventEndAt ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "ko-KR",
    isAccessibleForFree: event.isFree ?? undefined,
    location: compactObject({
      "@type": "Place",
      name: event.locationName?.trim() || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: locationAddress,
        addressCountry: "KR",
      },
      geo: event.latitude != null && event.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: event.latitude,
            longitude: event.longitude,
          }
        : undefined,
    }),
    image: imageUrl ? [absoluteUrl(imageUrl, siteUrl)] : undefined,
    offers: offer,
    performer: performers.length > 0 ? performers : undefined,
    organizer: event.organizer
      ? compactObject({
          "@type": "Organization",
          name: event.organizer,
          url: organizerUrl,
        })
      : undefined,
    url: eventUrl,
    mainEntityOfPage: eventUrl,
  });
}

export function buildEventBreadcrumbStructuredData(event: Event, siteUrl: string) {
  const homeUrl = absoluteUrl("/", siteUrl);
  const topicUrl = absoluteUrl(eventTopicPath(event.category), siteUrl);
  const eventUrl = absoluteUrl(`/events/${encodeURIComponent(event.slug)}`, siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${eventUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "속초모아",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `속초 ${categoryLabels[event.category]}`,
        item: topicUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: event.title,
        item: eventUrl,
      },
    ],
  };
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

function buildEventOffer(event: Event, applicationUrl: string, now: Date) {
  const price = eventOfferPrice(event);
  if (price == null || deriveEventState(event, now) === "ended") return undefined;

  const applicationState = deriveApplicationState(event, now);
  if (applicationState === "closed" || applicationState === "not_applicable") return undefined;

  // An open application window does not prove that tickets or seats remain.
  // Keep availability absent until the event data carries a verified stock status.
  return compactObject({
    "@type": "Offer",
    url: applicationUrl,
    price,
    priceCurrency: "KRW",
    validFrom: event.applicationStartAt ?? undefined,
  });
}

export function buildEventSeoDescription(event: Event) {
  const parts = [
    `${event.title} 일정 ${formatDateRange(event.eventStartAt, event.eventEndAt)}`,
    event.locationName ? `장소 ${event.locationName}` : null,
    getEventIntroduction(event)?.trim() || null,
  ].filter((part): part is string => Boolean(part));
  const description = parts.join(" · ");
  return description.length <= 160 ? description : `${description.slice(0, 159).trimEnd()}…`;
}

function absoluteUrl(value: string, siteUrl: string) {
  return new URL(value, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function cleanUrl(value: string | null | undefined, allowRootRelative = false) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (allowRootRelative && normalized.startsWith("/")) return normalized;
  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:" ? normalized : undefined;
  } catch {
    return undefined;
  }
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""),
  );
}
