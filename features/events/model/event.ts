// 공개 행사 한 건의 타입. 상태 계산은 event-state.ts, 목록 필터·정렬은 event-list.ts,
// 수집 후보 schema는 features/events/admin/candidate/schema.ts에 있다(2026-11-06 한 파일에서 나눔).
import type { EventReviewStatus } from "@/features/events/model/review-status";
import type { EventAudience, EventCategory } from "@/features/events/model/taxonomy";

/** 운영 방식. continuous는 행사 기간 내내, occurrences는 입력한 회차에만 연다. DB(schedule_mode), 관리자 폼, 목록 기간 필터가 이 값을 쓴다. */
export const eventScheduleModes = ["continuous", "occurrences"] as const;

export type EventScheduleMode = (typeof eventScheduleModes)[number];

export function isEventScheduleMode(value: string | undefined): value is EventScheduleMode {
  return eventScheduleModes.some((mode) => mode === value);
}

export interface EventOccurrence {
  id: string;
  startsAt: string;
  endsAt: string | null;
}

export interface EventPerformer {
  name: string;
  type: "Person" | "PerformingGroup";
}

// mapper(features/events/mappers.ts)가 모든 필드를 채운다. 예전 demo 데이터 때문에 선택 필드였던
// scheduleMode·occurrences·performers·organizerUrl·viewCount를 필수로 바꿨다(DB도 값이 늘 있음, 2026-11-07).
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
  scheduleMode: EventScheduleMode;
  occurrences: EventOccurrence[];
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
  /** 구조화 데이터(Event의 performer)에 쓰는, 확인된 출연자와 출연팀 */
  performers: EventPerformer[];
  organizer: string | null;
  /** 주최 기관의 공식 홈페이지(행사 상세 페이지가 아님) */
  organizerUrl: string | null;
  contact: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  reviewStatus: EventReviewStatus;
  isFeatured: boolean;
  /** 공개 행사 상세 페이지가 열린 횟수 */
  viewCount: number;
  lastVerifiedAt: string | null;
  publishedAt: string | null;
}

/**
 * 공개 화면의 행사 소개는 summary가 원본이다. description은 두 칸을 합치기 전에 만든 행에서만 읽는 예비 값이다.
 */
export function getEventIntroduction(event: Pick<Event, "summary" | "description">) {
  return event.summary ?? event.description;
}
