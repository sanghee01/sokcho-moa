import { type Event, getEventIntroduction } from "@/features/events/model/event";
import { deriveApplicationState, deriveEventState } from "@/features/events/model/event-state";
import { formatSentenceDateRange } from "@/features/events/model/format";
import { categoryLabels, type EventCategory } from "@/features/events/model/taxonomy";
import { eventTopicPath } from "@/features/events/model/topics";
import { resolveEventAddress } from "@/features/events/model/venue";
import { SITE_NAME } from "@/lib/seo/site-identity";
import { formatSeoulIsoDate, formatSeoulIsoDateTime, toSeoulWallClock } from "@/lib/seoul-time";
import { isHttpUrl } from "@/lib/url";

type EventStructuredData = Record<string, unknown>;

export function buildEventStructuredData(
  event: Event,
  siteUrl: string,
  now = new Date(),
): EventStructuredData | null {
  const locationAddress = resolveEventAddress(event);
  if (!locationAddress) return null;

  const eventUrl = absoluteUrl(`/events/${encodeURIComponent(event.slug)}`, siteUrl);
  const eventId = `${eventUrl}#event`;
  const applicationUrl = cleanUrl(event.applicationUrl);
  const imageUrl = cleanUrl(event.imageUrl, true);
  const offer = applicationUrl ? buildEventOffer(event, applicationUrl, now) : undefined;
  const performers = event.performers.map((performer) => ({
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
    startDate: structuredDataDate(event.eventStartAt, "start"),
    endDate: event.eventEndAt ? structuredDataDate(event.eventEndAt, "end") : undefined,
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
        name: SITE_NAME,
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

  const prices = Array.from(event.priceText.matchAll(KRW_AMOUNT_PATTERN))
    .map(parseKrwAmount)
    .filter((price): price is number => price !== null && Number.isFinite(price));
  return prices.length > 0 ? Math.min(...prices) : null;
}

// 기관 공고는 "20,000원"뿐 아니라 "2만원", "1만 5천원"으로도 요금을 쓴다. 만·천 단위를 읽지 못하면
// 유료 행사의 Offer가 통째로 빠져 Search Console에 offers 누락으로 잡힌다(2026-11-07).
const KRW_AMOUNT_PATTERN = /(?:(\d[\d,]*)\s*만\s*)?(?:(\d[\d,]*)\s*천\s*)?(\d[\d,]*)?\s*원/g;

function parseKrwAmount(match: RegExpMatchArray) {
  const [, tenThousands, thousands, units] = match;
  // "원문"처럼 숫자 없이 "원"만 걸린 경우는 금액이 아니다.
  if (tenThousands === undefined && thousands === undefined && units === undefined) return null;
  return toNumber(tenThousands) * 10_000 + toNumber(thousands) * 1_000 + toNumber(units);
}

function toNumber(value: string | undefined) {
  return value === undefined ? 0 : Number(value.replaceAll(",", ""));
}

function buildEventOffer(event: Event, applicationUrl: string, now: Date) {
  const price = eventOfferPrice(event);
  if (price == null || deriveEventState(event, now) === "ended") return undefined;

  const applicationState = deriveApplicationState(event, now);
  if (applicationState === "closed" || applicationState === "not_applicable") return undefined;

  // 신청 기간이 열려 있어도 표나 자리가 남았다는 뜻은 아니다. 확인된 잔여 정보가 생기기 전까지 availability는 넣지 않는다.
  return compactObject({
    "@type": "Offer",
    url: applicationUrl,
    price,
    priceCurrency: "KRW",
    validFrom: event.applicationStartAt ? structuredDataDateTime(event.applicationStartAt) : undefined,
  });
}

/**
 * 구조화 데이터의 행사 날짜. DB는 UTC(+00:00)로 돌려줘서 그대로 쓰면 서울 자정 시작 행사가 글자상 전날로 읽힌다.
 * 운영 데이터에서 시각 없는 행사는 서울 00:00 시작·23:59 종료로 저장돼 있어(2026-11-14 확인),
 * 그 경계면 Google 권장대로 시각 없이 날짜만 쓴다(2026-11-15).
 */
function structuredDataDate(value: string, boundary: "start" | "end") {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return value;
  const { hour, minute } = toSeoulWallClock(instant);
  const isDateOnly = boundary === "start" ? hour === 0 && minute === 0 : hour === 23 && minute === 59;
  return isDateOnly ? formatSeoulIsoDate(instant) : formatSeoulIsoDateTime(instant);
}

function structuredDataDateTime(value: string) {
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? value : formatSeoulIsoDateTime(instant);
}

/** 검색 결과·공유 미리보기 설명. 요약 문장으로 "언제·어디서·얼마"를 먼저 답하고 소개를 잇는다(2026-11-15). */
export function buildEventSeoDescription(event: Event) {
  const description = [buildEventSummary(event), getEventIntroduction(event)?.trim() || null]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return description.length <= 160 ? description : `${description.slice(0, 159).trimEnd()}…`;
}

// 요약 문장에서 분야를 부르는 이름. "기타"는 문장에 맞지 않아 "행사"로 쓴다.
const summaryCategoryNouns: Record<EventCategory, string> = {
  performance: "공연",
  festival: "축제",
  experience: "체험 프로그램",
  education: "교육 프로그램",
  exhibition: "전시",
  other: "행사",
};

/**
 * 검색 결과·공유 미리보기·RSS 설명의 요약 문장. 날짜·장소·요금·신청을 데이터로 조립하므로 원문과 어긋나지 않는다.
 * 화면에는 같은 내용이 핵심 정보 목록에 있어서 쓰지 않는다(2026-11-15 사용자 결정).
 */
export function buildEventSummary(event: Event) {
  const dates = formatSentenceDateRange(event.eventStartAt, event.eventEndAt);
  const when = dates ? `${dates.text}${dates.isSingleDay ? "에" : ""} ` : "";
  const sentences = [
    `${event.title}${topicParticle(event.title)} ${when}${summaryLocationPhrase(event.locationName)}열리는 ${summaryCategoryNouns[event.category]}입니다.`,
  ];

  // 요금은 무료이거나 금액을 읽을 수 있을 때만 쓴다. "요금 안내 없음" 같은 문구를 문장에 넣지 않는다.
  const price = eventOfferPrice(event);
  if (price === 0) sentences.push("요금은 무료입니다.");
  else if (price !== null && event.priceText) sentences.push(`요금은 ${event.priceText.trim()}입니다.`);

  const application = summaryApplicationSentence(event.applicationStartAt, event.applicationEndAt);
  if (application !== null) sentences.push(application);
  return sentences.join(" ");
}

// 문장에 넣기 어려운 장소 문구(수집 중 다른 내용이 섞인 긴 문구)는 뺀다. 화면은 원문 그대로 보여 준다.
const SUMMARY_LOCATION_MAX_CHARS = 40;

function summaryLocationPhrase(locationName: string | null) {
  const name = locationName?.trim();
  if (!name || name.includes(":") || name.length > SUMMARY_LOCATION_MAX_CHARS) return "";
  if (name.startsWith("온라인")) return "온라인으로 ";
  return `${name}에서 `;
}

function summaryApplicationSentence(start: string | null, end: string | null) {
  if (start && end) {
    const period = formatSentenceDateRange(start, end);
    if (!period) return null;
    return period.isSingleDay ? `신청은 ${period.text}에 받습니다.` : `신청 기간은 ${period.text}입니다.`;
  }
  const date = formatSentenceDateRange(end ?? start, null);
  if (!date) return null;
  return end ? `신청은 ${date.text}까지입니다.` : `신청은 ${date.text}부터입니다.`;
}

// 받침이 있으면 "은", 없으면 "는". 끝의 닫는 괄호·따옴표는 건너뛰고, 숫자는 한국어로 읽은 소리로 고른다.
// 영문처럼 받침을 정할 수 없는 글자는 "은(는)"으로 쓴다.
const TRAILING_CLOSERS_PATTERN = /[\s」』"'”’)\]}>》〉]+$/;
const DIGITS_WITH_FINAL_CONSONANT = "0136789";

function topicParticle(word: string) {
  const last = word.replace(TRAILING_CLOSERS_PATTERN, "").at(-1);
  if (!last) return "은(는)";
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? "는" : "은";
  if (/\d/.test(last)) return DIGITS_WITH_FINAL_CONSONANT.includes(last) ? "은" : "는";
  return "은(는)";
}

function absoluteUrl(value: string, siteUrl: string) {
  return new URL(value, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function cleanUrl(value: string | null | undefined, allowRootRelative = false) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (allowRootRelative && normalized.startsWith("/")) return normalized;
  return isHttpUrl(normalized) ? normalized : undefined;
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""),
  );
}
