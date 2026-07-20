import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildEventBrowseHref } from "@/lib/domain/event-navigation";

export const metadata: Metadata = {
  title: "행사 캘린더",
  description: "속초 행사의 실제 운영일정과 신청 가능 여부를 날짜별로 한눈에 확인하세요.",
  alternates: { canonical: "/" },
};

type CalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  redirect(buildEventBrowseHref(params, { view: "calendar" }));
}
