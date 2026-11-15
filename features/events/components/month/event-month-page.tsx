import { JsonLd } from "@/components/seo/json-ld";
import { EventMonthView } from "@/features/events/components/month/event-month-view";
import type { EventMonthPageData } from "@/features/events/month-page";
import { buildMonthStructuredData } from "@/features/events/month-seo";
import { getPublicEnv } from "@/lib/env";

/** 월별 행사 페이지와 달·분야 페이지가 함께 쓰는 틀. 데이터는 page가 loadEventMonthPage로 불러 넘긴다. */
export function EventMonthPage({ data }: { data: EventMonthPageData }) {
  const { month, category, events, previousMonth, nextMonth, now, description } = data;
  return (
    <main id="main-content">
      <JsonLd data={buildMonthStructuredData(month, events, description, getPublicEnv().NEXT_PUBLIC_SITE_URL, category)} />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:pt-10">
        <EventMonthView month={month} category={category} events={events} previousMonth={previousMonth} nextMonth={nextMonth} now={now} />
      </div>
    </main>
  );
}
