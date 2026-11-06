// 공개 행사 한 건의 타입. 상태 계산은 event-state.ts, 목록 필터·정렬은 event-list.ts,
// 수집 후보 schema는 features/events/admin/candidate.ts에 있다(2026-11-06 한 파일에서 나눔).
import type { EventReviewStatus } from "@/features/events/model/review-status";
import type { EventAudience, EventCategory } from "@/features/events/model/taxonomy";

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
