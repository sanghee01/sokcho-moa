import type { Metadata } from "next";
import { EventMonthPage } from "@/features/events/components/month/event-month-page";
import { formatEventMonthKey, getListedEventMonths } from "@/features/events/model/event-month";
import { loadEventMonthPage } from "@/features/events/month-page";
import { buildEventMonthMetadata } from "@/features/events/month-seo";

// 행사의 진행·종료 구역과 이번 달이 바뀌는 것을 반영하려고 다시 만든다(행사 상세와 같은 값).
// 실제 주기는 안에서 쓰는 행사 데이터 캐시(5분, features/events/queries.ts)를 따른다(빌드 결과로 확인, 2026-11-15).
export const revalidate = 3600;

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
