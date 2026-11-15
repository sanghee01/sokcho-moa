import type { Metadata } from "next";
import { EventMonthPage } from "@/features/events/components/month/event-month-page";
import { formatEventMonthKey, getListedEventMonths } from "@/features/events/model/event-month";
import { eventCategories } from "@/features/events/model/taxonomy";
import { loadEventMonthPage } from "@/features/events/month-page";
import { buildEventMonthMetadata } from "@/features/events/month-seo";

// 달 안에서 한 분야만 보는 페이지(예: /months/2026-11/education). "속초 11월 교육" 같은 검색에 답하고,
// 월별 페이지에서 헤더 분야 탭을 누르면 여기로 온다(2026-11-15 사용자 결정). 주기는 월별 페이지와 같다.
export const revalidate = 3600;

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
