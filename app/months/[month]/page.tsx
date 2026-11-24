import type { Metadata } from "next";
import { EventMonthPage } from "@/features/events/components/month/event-month-page";
import { formatEventMonthKey, getListedEventMonths } from "@/features/events/model/event-month";
import { loadEventMonthPage } from "@/features/events/month-page";
import { buildEventMonthMetadata } from "@/features/events/month-seo";

// 미리 만든 정적 결과로만 응답해야 하는 페이지다. 누가 요청 값(searchParams·cookies)이나 캐시하지 않은 조회를 더하면 빌드가 멈춘다.
// 루트 layout의 instant = false가 사이트 전체의 미리 만들기 검사를 끄므로, 검색 유입을 받는 정적 페이지는 여기서 따로 지킨다(2026-11-24 리뷰).
export const ensureStatic = "navigation";

// 행사의 진행·종료 구역과 이번 달이 바뀌는 것을 반영하려고 5분마다 다시 만든다. 예전에는 revalidate로 정했고,
// cacheComponents에서는 지금 시각을 쓰는 조회·화면이 'use cache'로 저장 기간을 정한다(features/events/month-page.ts, 2026-11-24).
export function generateStaticParams() {
  return getListedEventMonths().map((month) => ({ month: formatEventMonthKey(month) }));
}

export async function generateMetadata({ params }: PageProps<"/months/[month]">): Promise<Metadata> {
  const { month } = await params;
  return buildEventMonthMetadata(await loadEventMonthPage(month));
}

export default async function MonthPage({ params }: PageProps<"/months/[month]">) {
  const { month } = await params;
  return <EventMonthPage data={await loadEventMonthPage(month)} />;
}
