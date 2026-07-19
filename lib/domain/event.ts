import { z } from "zod";
import { isLikelyEventDetailUrl } from "./source";

export const eventCategories = [
  "performance",
  "festival",
  "experience",
  "education",
  "exhibition",
  "other",
] as const;

export const eventAudiences = ["child", "youth", "family", "adult", "all"] as const;

export type EventCategory = (typeof eventCategories)[number];
export type EventAudience = (typeof eventAudiences)[number];
export type ReviewStatus = "pending" | "published" | "rejected";

export type Event = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  category: EventCategory;
  audiences: EventAudience[];
  eventStartAt: string;
  eventEndAt: string | null;
  operatingHours: string | null;
  applicationStartAt: string | null;
  applicationEndAt: string | null;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  locationSourceUrl: string | null;
  locationVerifiedAt: string | null;
  priceText: string | null;
  isFree: boolean | null;
  organizer: string | null;
  contact: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  reviewStatus: ReviewStatus;
  isFeatured: boolean;
  isDemo: boolean;
  lastVerifiedAt: string | null;
  publishedAt: string | null;
};

export type Place = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  officialUrl: string | null;
  mapUrl: string | null;
  isPublished: boolean;
};

export type EventCandidate = {
  title: string;
  summary: string | null;
  description: string | null;
  category: EventCategory | null;
  audiences: EventAudience[];
  eventStartAt: string | null;
  eventEndAt: string | null;
  operatingHours: string | null;
  applicationStartAt: string | null;
  applicationEndAt: string | null;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  priceText: string | null;
  isFree: boolean | null;
  organizer: string | null;
  contact: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
};

const nullableUrl = z.string().url().nullable();
const nullableDateTime = z.string().datetime({ offset: true }).nullable();

export const eventCandidateSchema: z.ZodType<EventCandidate> = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).nullable(),
  description: z.string().trim().max(5_000).nullable(),
  category: z.enum(eventCategories).nullable(),
  audiences: z.array(z.enum(eventAudiences)).max(eventAudiences.length),
  eventStartAt: nullableDateTime,
  eventEndAt: nullableDateTime,
  operatingHours: z.string().trim().max(300).nullable(),
  applicationStartAt: nullableDateTime,
  applicationEndAt: nullableDateTime,
  locationName: z.string().trim().max(200).nullable(),
  address: z.string().trim().max(300).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  priceText: z.string().trim().max(200).nullable(),
  isFree: z.boolean().nullable(),
  organizer: z.string().trim().max(200).nullable(),
  contact: z.string().trim().max(200).nullable(),
  officialUrl: nullableUrl,
  applicationUrl: nullableUrl,
  imageUrl: nullableUrl,
  sourceName: z.string().trim().min(1).max(200),
  sourceUrl: z.string().url().refine(isLikelyEventDetailUrl, "기관 대표 홈이나 목록이 아닌 행사별 공식 원문 URL을 입력하세요."),
});

export type EventState = "upcoming" | "ongoing" | "ended";
export type ApplicationState = "not_applicable" | "upcoming" | "open" | "closing_today" | "closed";

export function deriveEventState(event: Pick<Event, "eventStartAt" | "eventEndAt">, now = new Date()): EventState {
  const start = new Date(event.eventStartAt);
  const end = new Date(event.eventEndAt ?? event.eventStartAt);
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "ongoing";
}

export function deriveApplicationState(
  event: Pick<Event, "applicationStartAt" | "applicationEndAt" | "applicationUrl">,
  now = new Date(),
): ApplicationState {
  if (!event.applicationStartAt && !event.applicationEndAt && !event.applicationUrl) return "not_applicable";
  if (event.applicationStartAt && now < new Date(event.applicationStartAt)) return "upcoming";
  if (event.applicationEndAt) {
    const end = new Date(event.applicationEndAt);
    if (now > end) return "closed";
    if (isSameKoreanDate(now, end)) return "closing_today";
  }
  return "open";
}

export type EventFilters = {
  when?: "today" | "week" | "month";
  applicationOpen?: boolean;
  free?: boolean;
  audience?: EventAudience;
  category?: EventCategory;
  query?: string;
};

export function parseEventFilters(params: Record<string, string | string[] | undefined>): EventFilters {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const when = one(params.when);
  const audience = one(params.audience);
  const category = one(params.category);
  const query = one(params.q)?.trim();
  return {
    when: when === "today" || when === "week" || when === "month" ? when : undefined,
    applicationOpen: one(params.application) === "open" || undefined,
    free: one(params.free) === "true" || undefined,
    audience: eventAudiences.includes(audience as EventAudience) ? (audience as EventAudience) : undefined,
    category: eventCategories.includes(category as EventCategory) ? (category as EventCategory) : undefined,
    query: query || undefined,
  };
}

export function filterEvents(events: Event[], filters: EventFilters, now = new Date()): Event[] {
  const range = filters.when ? getKoreanRange(filters.when, now) : null;
  const query = filters.query?.toLocaleLowerCase("ko-KR");

  return events.filter((event) => {
    if (event.reviewStatus !== "published") return false;
    if (filters.free && event.isFree !== true) return false;
    if (filters.category && event.category !== filters.category) return false;
    if (filters.audience && !event.audiences.includes(filters.audience) && !event.audiences.includes("all")) return false;
    if (filters.applicationOpen) {
      const state = deriveApplicationState(event, now);
      if (state !== "open" && state !== "closing_today") return false;
    }
    if (range) {
      const start = new Date(event.eventStartAt);
      const end = new Date(event.eventEndAt ?? event.eventStartAt);
      if (end < range.start || start >= range.end) return false;
    }
    if (query) {
      const haystack = [event.title, event.summary, event.locationName, event.sourceName]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ko-KR");
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function isEventToday(event: Event, now = new Date()) {
  return filterEvents([event], { when: "today" }, now).length === 1;
}

function getKoreanParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function koreanDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - 9 * 60 * 60 * 1_000);
}

function getKoreanRange(when: NonNullable<EventFilters["when"]>, now: Date) {
  const { year, month, day } = getKoreanParts(now);
  if (when === "month") {
    return { start: koreanDate(year, month, 1), end: koreanDate(year, month + 1, 1) };
  }
  const start = koreanDate(year, month, day);
  const days = when === "today" ? 1 : 7;
  return { start, end: new Date(start.getTime() + days * 24 * 60 * 60 * 1_000) };
}

function isSameKoreanDate(a: Date, b: Date) {
  const ap = getKoreanParts(a);
  const bp = getKoreanParts(b);
  return ap.year === bp.year && ap.month === bp.month && ap.day === bp.day;
}
