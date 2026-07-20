import type { Metadata } from "next";
import Link from "next/link";
import { EventCalendar } from "@/components/event-calendar";
import { getAllPublicEvents } from "@/lib/data/events";
import { buildCalendarMonth, resolveCalendarMonth } from "@/lib/domain/calendar";

export const metadata: Metadata = {
  title: "행사 캘린더",
  description: "속초 행사의 실제 운영일정과 신청 가능 여부를 날짜별로 한눈에 확인하세요.",
  alternates: { canonical: "/calendar" },
};

type CalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const now = new Date();
  const monthKey = resolveCalendarMonth(params.month, now);
  const events = await getAllPublicEvents();
  const calendar = buildCalendarMonth(events, monthKey, now);
  const demoMode = events.some((event) => event.isDemo);

  return (
    <main id="main-content" className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-teal-700">날짜로 찾는 속초의 요즘</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">행사 캘린더</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            행사기간과 운영일이 다른 일정도 실제로 열리는 날짜에 맞춰 확인하고, 신청 상태도 함께 살펴보세요.
          </p>
        </div>
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-2xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-black text-teal-800 shadow-sm hover:bg-teal-50 sm:self-auto">
          <span aria-hidden="true">←</span>&nbsp; 목록으로 보기
        </Link>
      </header>

      {demoMode && (
        <aside className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" aria-label="샘플 데이터 안내">
          <strong>샘플 데이터로 보는 캘린더입니다.</strong> 제목에 [샘플]이 붙은 행사는 실제 운영 정보가 아닙니다.
        </aside>
      )}

      <EventCalendar key={calendar.monthKey} month={calendar} />
    </main>
  );
}
