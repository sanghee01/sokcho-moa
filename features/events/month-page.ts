import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { PUBLIC_EVENTS_CACHE_TAG } from "@/features/events/cache";
import {
  buildEventMonthDescription,
  isEventMonthPublic,
  parseEventMonth,
  selectMonthEvents,
  shiftEventMonth,
} from "@/features/events/model/event-month";
import { isEventCategory } from "@/features/events/model/taxonomy";
import { getAllPublicEvents } from "@/features/events/queries";
import { PUBLIC_PAGE_CACHE_LIFE } from "@/lib/public-cache-life";

/**
 * 월별 행사 페이지(/months/YYYY-MM)와 달·분야 페이지(/months/YYYY-MM/<분야>)가 함께 쓰는 조회.
 * 주소의 월·분야를 검증하고 그 행사를 고른다. 형식이 틀리거나 열지 않는 달, 없는 분야면 404다.
 * 열리는 달은 분야와 관계없이 그 달 전체 행사로 정한다. 분야만 비어 있으면 화면은 열고 검색에는 올리지 않는다(month-seo.ts).
 */
export async function loadEventMonthPage(monthValue: string, categoryValue?: string) {
  const data = await getEventMonthPageData(monthValue, categoryValue);
  if (data === null) notFound();
  return data;
}

/**
 * 열 수 있는 달인지와 진행·종료 구역이 지금 시각으로 정해져, 고른 결과를 5분 저장해 둔다(전환 전 다시 만들던 주기와 같음).
 * cacheComponents에서는 미리 만드는 화면이 new Date()를 쓰려면 'use cache'로 저장해야 한다(2026-11-24).
 * 저장하는 함수 안에서는 notFound()를 부르지 않고 null을 돌려준다. 404는 위 loadEventMonthPage가 낸다.
 */
async function getEventMonthPageData(monthValue: string, categoryValue?: string) {
  "use cache";
  cacheLife(PUBLIC_PAGE_CACHE_LIFE);
  cacheTag(PUBLIC_EVENTS_CACHE_TAG);
  const month = parseEventMonth(monthValue);
  if (!month) return null;
  if (categoryValue !== undefined && !isEventCategory(categoryValue)) return null;
  const category = categoryValue;
  const allEvents = await getAllPublicEvents();
  const now = new Date();
  if (!isEventMonthPublic(month, allEvents, now)) return null;

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
