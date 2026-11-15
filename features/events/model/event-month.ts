// 월별 행사 페이지(/months/YYYY-MM)의 월 계산, 행사 고르기, 요약 문장.
// "11월 속초 행사"처럼 기간으로 찾는 검색과 AI 개요에 바로 답하는 페이지를 만들려고 추가했다(2026-11-15 사용자 결정).
import type { Event } from "@/features/events/model/event";
import { overlapsEventSchedule } from "@/features/events/model/event-list";
import { deriveEventState } from "@/features/events/model/event-state";
import { categoryLabels, eventCategories } from "@/features/events/model/taxonomy";
import { getSeoulDateParts, getSeoulMidnight } from "@/lib/seoul-time";

export interface EventMonth {
  year: number;
  month: number;
}

const EVENT_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** 주소의 "2026-11"을 월로. 0을 채운 형식만 받아 같은 달이 여러 주소로 열리지 않게 한다. */
export function parseEventMonth(value: string): EventMonth | null {
  const match = EVENT_MONTH_PATTERN.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
}

export function formatEventMonthKey({ year, month }: EventMonth) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function eventMonthPath(month: EventMonth) {
  return `/months/${formatEventMonthKey(month)}`;
}

/** 화면·제목의 월 이름(예: "2026년 11월") */
export function formatEventMonthLabel({ year, month }: EventMonth) {
  return `${year}년 ${month}월`;
}

export function getCurrentEventMonth(now = new Date()): EventMonth {
  const { year, month } = getSeoulDateParts(now);
  return { year, month };
}

export function shiftEventMonth({ year, month }: EventMonth, delta: number): EventMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function monthIndex({ year, month }: EventMonth) {
  return year * 12 + month;
}

function eventMonthRange({ year, month }: EventMonth) {
  return { start: getSeoulMidnight(year, month, 1), end: getSeoulMidnight(year, month + 1, 1) };
}

/** 목록 아래 링크와 sitemap에 넣는 달: 이번 달과 다음 달(2026-11-15 사용자 결정). */
export function getListedEventMonths(now = new Date()): EventMonth[] {
  const current = getCurrentEventMonth(now);
  return [current, shiftEventMonth(current, 1)];
}

/** 그 달(KST)에 하루라도 열리는 공개 행사. 시작일순이고, 같으면 제목순이다. */
export function selectMonthEvents(events: Event[], month: EventMonth): Event[] {
  const range = eventMonthRange(month);
  return events
    .filter((event) => event.reviewStatus === "published" && overlapsEventSchedule(event, range))
    .sort((a, b) => a.eventStartAt.localeCompare(b.eventStartAt) || a.title.localeCompare(b.title, "ko-KR"));
}

/**
 * 이 달의 페이지를 열지. 이번 달·다음 달은 행사가 없어도 열고, 지난 달은 행사가 있을 때만 연다.
 * 지난 달 주소는 검색에 이미 올라갔을 수 있어 404로 바꾸지 않는다. 다다음 달부터는 열지 않는다(2026-11-15 사용자 결정).
 */
export function isEventMonthPublic(month: EventMonth, events: Event[], now = new Date()) {
  const current = monthIndex(getCurrentEventMonth(now));
  const target = monthIndex(month);
  if (target > current + 1) return false;
  if (target >= current) return true;
  return selectMonthEvents(events, month).length > 0;
}

/** 아직 참여할 수 있는(끝나지 않은) 행사와 끝난 행사. 신청만 마감된 행사는 행사가 열리고 있어 앞쪽에 둔다. */
export function partitionMonthEvents(events: Event[], now = new Date()) {
  const current: Event[] = [];
  const ended: Event[] = [];
  for (const event of events) {
    (deriveEventState(event, now) === "ended" ? ended : current).push(event);
  }
  return { current, ended };
}

/**
 * 월 페이지 맨 위 요약 문장. 화면, 검색 결과 설명, AI 개요가 함께 읽는다.
 * 행사 수와 분야별 수를 쓰고, 이미 끝난 행사가 있으면 오늘(KST) 기준 남은 수를 덧붙인다. events는 selectMonthEvents의 결과다.
 */
export function buildEventMonthSummary(month: EventMonth, events: Event[], now = new Date()) {
  const label = formatEventMonthLabel(month);
  if (events.length === 0) return `${label} 속초 행사 일정은 아직 올라오지 않았어요.`;

  const categoryCounts = eventCategories
    .map((category) => ({ category, count: events.filter((event) => event.category === category).length }))
    .filter(({ count }) => count > 0)
    .map(({ category, count }) => `${categoryLabels[category]} ${count}개`);
  const sentences = [`${label} 속초에서 열리는 행사는 모두 ${events.length}개예요(${categoryCounts.join(", ")}).`];

  const { current } = partitionMonthEvents(events, now);
  if (current.length < events.length) {
    const today = getSeoulDateParts(now);
    const basis = `${today.month}월 ${today.day}일 기준으로`;
    sentences.push(current.length === 0
      ? `${basis} 모두 끝났어요.`
      : `${basis} 진행 중이거나 예정된 행사는 ${current.length}개예요.`);
  }
  return sentences.join(" ");
}
