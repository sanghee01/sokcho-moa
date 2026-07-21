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
export type EventScheduleMode = "continuous" | "occurrences";

export type EventOccurrence = {
  id: string;
  startsAt: string;
  endsAt: string | null;
};

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
  /** Defaults to continuous for legacy/demo rows that predate structured schedules. */
  scheduleMode?: EventScheduleMode;
  occurrences?: EventOccurrence[];
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
  /** 공개 행사 상세 페이지가 열린 횟수. 마이그레이션 전 데이터는 0으로 취급한다. */
  viewCount?: number;
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
  audience?: EventAudience;
  category?: EventCategory;
  query?: string;
  sort?: "latest" | "deadline" | "views" | "published";
};

export function parseEventFilters(params: Record<string, string | string[] | undefined>): EventFilters {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const when = one(params.when);
  const audience = one(params.audience);
  const category = one(params.category);
  const query = one(params.q)?.trim();
  const sort = one(params.sort);
  return {
    when: when === "today" || when === "week" || when === "month" ? when : undefined,
    applicationOpen: one(params.application) === "open" || undefined,
    audience: eventAudiences.includes(audience as EventAudience) ? (audience as EventAudience) : undefined,
    category: eventCategories.includes(category as EventCategory) ? (category as EventCategory) : undefined,
    query: query || undefined,
    sort: sort === "latest" || sort === "deadline" || sort === "views" || sort === "published" ? sort : undefined,
  };
}

export function filterEvents(events: Event[], filters: EventFilters, now = new Date()): Event[] {
  const range = filters.when ? getKoreanRange(filters.when, now) : null;
  const query = filters.query?.toLocaleLowerCase("ko-KR");

  return events.filter((event) => {
    if (event.reviewStatus !== "published") return false;
    if (filters.category && event.category !== filters.category) return false;
    if (filters.audience && !event.audiences.includes(filters.audience) && !event.audiences.includes("all")) return false;
    if (filters.applicationOpen) {
      const state = deriveApplicationState(event, now);
      const isAvailable = state === "not_applicable" || state === "open" || state === "closing_today";
      if (!isAvailable || deriveEventState(event, now) === "ended") return false;
    }
    if (range) {
      const overlapsActualSchedule = eventScheduleRanges(event).some(({ start, end }) => (
        end >= range.start && start < range.end
      ));
      if (!overlapsActualSchedule) return false;
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

/**
 * 목록 정렬은 필터 적용 뒤에 수행한다. 조회수가 없는 기존 행사는 0으로 취급한다.
 */
export function sortEvents(events: Event[], sort: EventFilters["sort"] = "published", now = new Date()): Event[] {
  return [...events].sort((a, b) => {
    if (sort === "views") {
      const viewDifference = (b.viewCount ?? 0) - (a.viewCount ?? 0);
      if (viewDifference !== 0) return viewDifference;
    }

    const publishDifference = dateTimestamp(b.publishedAt) - dateTimestamp(a.publishedAt);
    if (sort === "published" && publishDifference !== 0) return publishDifference;

    if (sort === "latest") {
      const scheduleDifference = compareLatestSchedule(a, b, now);
      if (scheduleDifference !== 0) return scheduleDifference;
    }

    if (sort === "deadline") {
      const deadlineDifference = compareApplicationDeadline(a, b, now);
      if (deadlineDifference !== 0) return deadlineDifference;
    }

    if (publishDifference !== 0) return publishDifference;

    return a.eventStartAt.localeCompare(b.eventStartAt) || a.title.localeCompare(b.title, "ko-KR");
  });
}

function compareApplicationDeadline(a: Event, b: Event, now: Date) {
  const aDeadline = actionableApplicationDeadline(a, now);
  const bDeadline = actionableApplicationDeadline(b, now);
  if (aDeadline !== bDeadline) return aDeadline - bDeadline;
  return compareLatestSchedule(a, b, now);
}

function actionableApplicationDeadline(event: Event, now: Date) {
  if (!event.applicationEndAt || deriveEventState(event, now) === "ended") return Number.POSITIVE_INFINITY;
  const applicationState = deriveApplicationState(event, now);
  if (applicationState !== "open" && applicationState !== "closing_today") return Number.POSITIVE_INFINITY;
  const deadline = dateTimestamp(event.applicationEndAt);
  return deadline >= now.getTime() ? deadline : Number.POSITIVE_INFINITY;
}

function compareLatestSchedule(a: Event, b: Event, now: Date) {
  const aState = deriveEventState(a, now);
  const bState = deriveEventState(b, now);
  const statePriority: Record<EventState, number> = { upcoming: 0, ongoing: 1, ended: 2 };
  const stateDifference = statePriority[aState] - statePriority[bState];
  if (stateDifference !== 0) return stateDifference;

  if (aState === "ongoing") {
    return dateTimestamp(b.eventStartAt) - dateTimestamp(a.eventStartAt);
  }
  if (aState === "upcoming") {
    return dateTimestamp(a.eventStartAt) - dateTimestamp(b.eventStartAt);
  }

  return dateTimestamp(b.eventEndAt ?? b.eventStartAt) - dateTimestamp(a.eventEndAt ?? a.eventStartAt);
}

function dateTimestamp(value: string | null) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function eventScheduleRanges(event: Event) {
  const values = event.scheduleMode === "occurrences"
    ? (event.occurrences ?? []).map((occurrence) => ({ startsAt: occurrence.startsAt, endsAt: occurrence.endsAt }))
    : [{ startsAt: event.eventStartAt, endsAt: event.eventEndAt }];

  return values.flatMap(({ startsAt, endsAt }) => {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return [];
    const rawEnd = new Date(endsAt ?? startsAt);
    const end = Number.isNaN(rawEnd.getTime()) || rawEnd < start ? start : rawEnd;
    return [{ start, end }];
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
