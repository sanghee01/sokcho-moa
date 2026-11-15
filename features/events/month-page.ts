import "server-only";
import { notFound } from "next/navigation";
import {
  buildEventMonthDescription,
  isEventMonthPublic,
  parseEventMonth,
  selectMonthEvents,
  shiftEventMonth,
} from "@/features/events/model/event-month";
import { isEventCategory } from "@/features/events/model/taxonomy";
import { getAllPublicEvents } from "@/features/events/queries";

/**
 * 월별 행사 페이지(/months/YYYY-MM)와 달·분야 페이지(/months/YYYY-MM/<분야>)가 함께 쓰는 조회.
 * 주소의 월·분야를 검증하고 그 행사를 고른다. 형식이 틀리거나 열지 않는 달, 없는 분야면 404다.
 * 열리는 달은 분야와 관계없이 그 달 전체 행사로 정한다. 분야만 비어 있으면 화면은 열고 검색에는 올리지 않는다(month-seo.ts).
 */
export async function loadEventMonthPage(monthValue: string, categoryValue?: string) {
  const month = parseEventMonth(monthValue);
  if (!month) notFound();
  if (categoryValue !== undefined && !isEventCategory(categoryValue)) notFound();
  const category = categoryValue;
  const allEvents = await getAllPublicEvents();
  const now = new Date();
  if (!isEventMonthPublic(month, allEvents, now)) notFound();

  const events = selectMonthEvents(allEvents, month, category);
  const previousMonth = shiftEventMonth(month, -1);
  const nextMonth = shiftEventMonth(month, 1);
  return {
    month,
    category,
    events,
    previousMonth: isEventMonthPublic(previousMonth, allEvents, now) ? previousMonth : null,
    nextMonth: isEventMonthPublic(nextMonth, allEvents, now) ? nextMonth : null,
    now,
    description: buildEventMonthDescription(month, events, category),
  };
}

export type EventMonthPageData = Awaited<ReturnType<typeof loadEventMonthPage>>;
