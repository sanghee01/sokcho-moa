import type { Metadata } from "next";
import { EventMonthPage } from "@/features/events/components/month/event-month-page";
import { formatEventMonthKey, getListedEventMonths } from "@/features/events/model/event-month";
import { eventCategories } from "@/features/events/model/taxonomy";
import { loadEventMonthPage } from "@/features/events/month-page";
import { buildEventMonthMetadata } from "@/features/events/month-seo";

// 미리 만든 정적 결과로만 응답해야 하는 페이지다. 누가 요청 값(searchParams·cookies)이나 캐시하지 않은 조회를 더하면 빌드가 멈춘다.
// 루트 layout의 instant = false가 사이트 전체의 미리 만들기 검사를 끄므로, 검색 유입을 받는 정적 페이지는 여기서 따로 지킨다(2026-11-24 리뷰).
export const ensureStatic = "navigation";

// 달 안에서 한 분야만 보는 페이지(예: /months/2026-11/education). "속초 11월 교육" 같은 검색에 답하고,
// 월별 페이지에서 헤더 분야 탭을 누르면 여기로 온다(2026-11-15 사용자 결정). 다시 만드는 주기는 월별 페이지와 같다(features/events/month-page.ts).
export function generateStaticParams() {
  return getListedEventMonths().flatMap((month) => (
    eventCategories.map((category) => ({ month: formatEventMonthKey(month), category }))
  ));
}

export async function generateMetadata({ params }: PageProps<"/months/[month]/[category]">): Promise<Metadata> {
  const { month, category } = await params;
  return buildEventMonthMetadata(await loadEventMonthPage(month, category));
}

export default async function MonthCategoryPage({ params }: PageProps<"/months/[month]/[category]">) {
  const { month, category } = await params;
  return <EventMonthPage data={await loadEventMonthPage(month, category)} />;
}
