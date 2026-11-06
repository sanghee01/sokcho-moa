import { deriveApplicationState, deriveEventUnavailableReason } from "@/features/events/model/event-state";
import { getSeoulDateParts } from "@/lib/seoul-time";
import type { EventStatusFields } from "@/features/events/model/status-fields";

export type EventBadgeTone = "danger" | "success" | "neutral" | "muted";
export interface EventBadge { label: string; tone: EventBadgeTone }

const MAX_BADGES = 2;
/** 마감까지 이 일수 이하로 남으면 "사전 신청" 대신 "신청 D-N"을 강조 색으로 보여 준다. */
const DEADLINE_SOON_DAYS = 3;

/**
 * 행사 목록·상세에 보여 줄 상태 배지를 고른다. 규칙의 원본은 .ai/DESIGN.md의 "행사 상태의 색"이다.
 * - 더 이상 참여할 수 없는 행사는 그 이유 하나만 보여 준다.
 * - 신청이 필요한 행사는 "사전 신청"을, 마감이 1~3일 남았으면 "신청 D-N", 당일이면 "오늘 마감"을 보여 준다.
 *   "신청 가능"은 '신청해도 된다'로도 읽혀서 쓰지 않는다(2026-11-06).
 * - 그다음 무료를 붙이고, 최대 2개까지만 보여 준다.
 * - 진행 중·예정, 별도 신청 없음은 배지로 보여 주지 않는다(메타 줄의 글자로 보여 준다).
 */
export function selectEventBadges(event: EventStatusFields, now = new Date()): EventBadge[] {
  const unavailableReason = deriveEventUnavailableReason(event, now);
  if (unavailableReason === "event_ended") return [{ label: "종료된 행사예요", tone: "muted" }];
  if (unavailableReason === "application_closed") return [{ label: "신청이 마감된 행사예요", tone: "muted" }];

  const badges: EventBadge[] = [];
  const applicationState = deriveApplicationState(event, now);
  if (applicationState === "closing_today") badges.push({ label: "오늘 마감", tone: "danger" });
  if (applicationState === "open") {
    const daysLeft = event.applicationEndAt ? koreanDaysBetween(now, new Date(event.applicationEndAt)) : null;
    badges.push(daysLeft !== null && daysLeft <= DEADLINE_SOON_DAYS
      ? { label: `신청 D-${daysLeft}`, tone: "danger" }
      : { label: "사전 신청", tone: "success" });
  }
  if (event.isFree) badges.push({ label: "무료", tone: "neutral" });

  return badges.slice(0, MAX_BADGES);
}

/** 두 시각 사이의 KST 달력 날짜 차이. 밤 11시 30분과 다음 날 새벽 0시 30분은 1일이다. */
function koreanDaysBetween(from: Date, to: Date) {
  const a = getSeoulDateParts(from);
  const b = getSeoulDateParts(to);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}
