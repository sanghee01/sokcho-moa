import { z } from "zod";
import {
  eventAudiences,
  eventCategories,
  type EventAudience,
  type EventCategory,
} from "@/features/events/model/taxonomy";
import type { EventReviewStatus } from "@/features/events/model/review-status";
import { isLikelyEventDetailUrl } from "@/features/events/model/source-url";
import { httpUrlSchema } from "@/lib/url";

export { eventAudiences, eventCategories, type EventAudience, type EventCategory } from "@/features/events/model/taxonomy";
export type EventScheduleMode = "continuous" | "occurrences";

export interface EventOccurrence {
  id: string;
  startsAt: string;
  endsAt: string | null;
}

export interface EventPerformer {
  name: string;
  type: "Person" | "PerformingGroup";
}

export interface Event {
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
  /** Verified people and groups used by Event structured data. */
  performers?: EventPerformer[];
  organizer: string | null;
  /** Official website for the event host or organizer. */
  organizerUrl?: string | null;
  contact: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  reviewStatus: EventReviewStatus;
  isFeatured: boolean;
  /** 공개 행사 상세 페이지가 열린 횟수. 마이그레이션 전 데이터는 0으로 취급한다. */
  viewCount?: number;
  lastVerifiedAt: string | null;
  publishedAt: string | null;
}

/**
 * The public event introduction is stored in `summary`. `description` remains
 * as a read-only fallback for rows created before the fields were combined.
 */
export function getEventIntroduction(event: Pick<Event, "summary" | "description">) {
  return event.summary ?? event.description;
}

export interface EventCandidate {
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
}

const nullableUrl = httpUrlSchema.nullable();
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
  sourceUrl: httpUrlSchema.refine(isLikelyEventDetailUrl, "기관 대표 홈이나 목록이 아닌 행사별 공식 원문 URL을 입력하세요."),
}).superRefine((candidate, context) => {
  // DB 제약(events_time_order, events_application_order, events_coordinates_pair)과 같은 검사.
  if (candidate.eventEndAt && !candidate.eventStartAt) {
    context.addIssue({ code: "custom", path: ["eventStartAt"], message: "eventEndAt이 있으면 eventStartAt도 필요합니다." });
  }
  if (candidate.eventStartAt && candidate.eventEndAt && new Date(candidate.eventEndAt) < new Date(candidate.eventStartAt)) {
    context.addIssue({ code: "custom", path: ["eventEndAt"], message: "eventEndAt은 eventStartAt보다 빠를 수 없습니다." });
  }
  if (candidate.applicationStartAt && candidate.applicationEndAt
    && new Date(candidate.applicationEndAt) < new Date(candidate.applicationStartAt)) {
    context.addIssue({ code: "custom", path: ["applicationEndAt"], message: "applicationEndAt은 applicationStartAt보다 빠를 수 없습니다." });
  }
  if ((candidate.latitude === null) !== (candidate.longitude === null)) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "latitude와 longitude는 함께 입력하거나 함께 비워야 합니다." });
  }
});

export type EventState = "upcoming" | "ongoing" | "ended";
export type ApplicationState = "not_applicable" | "upcoming" | "open" | "closing_today" | "closed";
export type EventUnavailableReason = "application_closed" | "event_ended";

/**
 * 행사가 끝나는 시각. 종료일이 없으면 시작한 날(KST) 하루 행사로 보고 그날 23:59:59.999 KST를 종료로 쓴다.
 * 관리자 폼이 날짜만 입력된 종료를 그날 끝으로 저장하는 것과 같은 기준이다.
 */
export function effectiveEnd(startsAt: string, endsAt: string | null) {
  if (endsAt) return new Date(endsAt);
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return start;
  const { year, month, day } = getKoreanParts(start);
  return new Date(koreanDate(year, month, day + 1).getTime() - 1);
}

export function deriveEventState(event: Pick<Event, "eventStartAt" | "eventEndAt">, now = new Date()): EventState {
  const start = new Date(event.eventStartAt);
  const end = effectiveEnd(event.eventStartAt, event.eventEndAt);
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

export function deriveEventUnavailableReason(
  event: Pick<Event, "eventStartAt" | "eventEndAt" | "applicationStartAt" | "applicationEndAt" | "applicationUrl">,
  now = new Date(),
): EventUnavailableReason | null {
  if (deriveApplicationState(event, now) === "closed") return "application_closed";
  if (deriveEventState(event, now) === "ended") return "event_ended";
  return null;
}

export interface EventFilters {
  when?: "today" | "week" | "month";
  applicationOpen?: boolean;
  status?: "active" | "closed";
  audience?: EventAudience;
  category?: EventCategory;
  query?: string;
  sort?: "latest" | "deadline" | "views" | "published";
}

export function parseEventFilters(params: Record<string, string | string[] | undefined>): EventFilters {
  function one(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
  }
  const when = one(params.when);
  const audience = one(params.audience);
  const category = one(params.category);
  const query = one(params.q)?.trim();
  const sort = one(params.sort);
  const status = one(params.status);
  return {
    when: when === "today" || when === "week" || when === "month" ? when : undefined,
    applicationOpen: one(params.application) === "open" || undefined,
    status: status === "closed" ? "closed" : "active",
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
    const isClosed = isEventClosedForDiscovery(event, now);
    if (filters.status === "active" && isClosed) return false;
    if (filters.status === "closed" && !isClosed) return false;
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
      const haystack = [event.title, getEventIntroduction(event), event.locationName, event.sourceName]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ko-KR");
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/**
 * 기본 탐색과 추천에서 더 이상 참여할 수 없는 행사를 같은 기준으로 분리한다.
 * 신청이 마감됐거나 행사 자체가 끝났다면 기록용 마감 행사로 본다.
 */
export function isEventClosedForDiscovery(event: Event, now = new Date()) {
  return deriveEventUnavailableReason(event, now) !== null;
}

export function getRelatedEvents(current: Event, events: Event[], limit = 4, now = new Date()) {
  const currentStart = new Date(current.eventStartAt).getTime();
  const currentEnd = effectiveEnd(current.eventStartAt, current.eventEndAt).getTime();
  return events
    .filter((event) => event.id !== current.id && !isEventClosedForDiscovery(event, now))
    .map((event) => {
      const start = new Date(event.eventStartAt).getTime();
      const end = effectiveEnd(event.eventStartAt, event.eventEndAt).getTime();
      const overlaps = start <= currentEnd && end >= currentStart;
      const sharesAudience = event.audiences.some((audience) => current.audiences.includes(audience));
      return { event, score: (overlaps ? 4 : 0) + (event.category === current.category ? 2 : 0) + (sharesAudience ? 1 : 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.event.eventStartAt.localeCompare(b.event.eventStartAt))
    .slice(0, limit)
    .map(({ event }) => event);
}

/**
 * 홈 위쪽 "지금 많이 보는 행사". 참여할 수 있는 행사(종료·신청 마감 제외) 중 조회수가 1 이상인 것을
 * 조회수가 많은 순서로, 같으면 먼저 시작하는 순서로 고른다.
 */
export function selectPopularEvents(events: Event[], now = new Date(), limit = 3): Event[] {
  return events
    .filter((event) => (event.viewCount ?? 0) > 0 && !isEventClosedForDiscovery(event, now))
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0) || a.eventStartAt.localeCompare(b.eventStartAt))
    .slice(0, limit);
}

/** 목록의 기본 정렬. 2026-11-06 게시순에서 행사일순(날짜 묶음)으로 바꿨다(.ai/DESIGN.md). */
export const DEFAULT_EVENT_SORT = "latest" satisfies NonNullable<EventFilters["sort"]>;

const RECENTLY_PUBLISHED_MS = 7 * 24 * 60 * 60 * 1_000;

/**
 * 속초모아에 공개된 지 7일이 지나지 않은 행사인지. 행사 날짜가 아니라 published_at(사이트에 올라온 시각)을 본다.
 * 수집이 늦어 오래전에 시작한 행사라도, 다시 찾아온 사용자에게는 처음 보는 행사이기 때문이다.
 */
export function isRecentlyPublished(event: Pick<Event, "publishedAt">, now = new Date()) {
  if (!event.publishedAt) return false;
  const elapsed = now.getTime() - new Date(event.publishedAt).getTime();
  return elapsed >= 0 && elapsed < RECENTLY_PUBLISHED_MS;
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

  return effectiveEndTimestamp(b) - effectiveEndTimestamp(a);
}

function effectiveEndTimestamp(event: Event) {
  const timestamp = effectiveEnd(event.eventStartAt, event.eventEndAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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
    const rawEnd = effectiveEnd(startsAt, endsAt);
    const end = Number.isNaN(rawEnd.getTime()) || rawEnd < start ? start : rawEnd;
    return [{ start, end }];
  });
}

export function getKoreanParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  function value(type: Intl.DateTimeFormatPartTypes) {
    return Number(parts.find((part) => part.type === type)?.value);
  }
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
