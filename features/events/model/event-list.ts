// 행사 목록의 주소 필터 해석, 필터, 정렬과 목록에서 고르는 묶음(관련 행사, 많이 보는 행사, 최근 게시).
import { getEventIntroduction, type Event } from "@/features/events/model/event";
import {
  deriveApplicationState,
  deriveEventState,
  effectiveEnd,
  isEventClosedForDiscovery,
  type EventState,
} from "@/features/events/model/event-state";
import { eventAudiences, eventCategories, type EventAudience, type EventCategory } from "@/features/events/model/taxonomy";
import { getSeoulDateParts, getSeoulMidnight } from "@/lib/seoul-time";

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
  const range = filters.when ? getSeoulFilterRange(filters.when, now) : null;
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

function getSeoulFilterRange(when: NonNullable<EventFilters["when"]>, now: Date) {
  const { year, month, day } = getSeoulDateParts(now);
  if (when === "month") {
    return { start: getSeoulMidnight(year, month, 1), end: getSeoulMidnight(year, month + 1, 1) };
  }
  const start = getSeoulMidnight(year, month, day);
  const days = when === "today" ? 1 : 7;
  return { start, end: new Date(start.getTime() + days * 24 * 60 * 60 * 1_000) };
}
