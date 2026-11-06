// 행사·신청의 진행 상태 계산. 화면 배지, 목록 필터, 구조화 데이터가 모두 이 기준을 쓴다.
import type { Event } from "@/features/events/model/event";
import { getSeoulDateParts, getSeoulMidnight, isSameSeoulDate } from "@/lib/seoul-time";

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
  const { year, month, day } = getSeoulDateParts(start);
  return new Date(getSeoulMidnight(year, month, day + 1).getTime() - 1);
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
    if (isSameSeoulDate(now, end)) return "closing_today";
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

/**
 * 기본 탐색과 추천에서 더 이상 참여할 수 없는 행사를 같은 기준으로 분리한다.
 * 신청이 마감됐거나 행사 자체가 끝났다면 기록용 마감 행사로 본다.
 */
export function isEventClosedForDiscovery(event: Event, now = new Date()) {
  return deriveEventUnavailableReason(event, now) !== null;
}
