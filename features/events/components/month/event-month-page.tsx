import { JsonLd } from "@/components/seo/json-ld";
import { CategoryNavigation } from "@/features/events/components/browse/category-navigation";
import { EventViewTabs } from "@/features/events/components/browse/event-view-tabs";
import { EventMonthView } from "@/features/events/components/month/event-month-view";
import type { EventMonthPageData } from "@/features/events/month-page";
import { buildMonthStructuredData } from "@/features/events/month-seo";
import { buildEventBrowseHref, withEventBrowsePath } from "@/features/events/model/browse-url";
import { getPublicEnv } from "@/lib/env";

/** 월별 행사 페이지와 달·분야 페이지가 함께 쓰는 틀. 데이터는 page가 loadEventMonthPage로 불러 넘긴다. */
export function EventMonthPage({ data }: { data: EventMonthPageData }) {
  const { month, category, events, previousMonth, nextMonth, now, description } = data;
  return (
    <main id="main-content">
      <JsonLd data={buildMonthStructuredData(month, events, description, getPublicEnv().NEXT_PUBLIC_SITE_URL, category)} />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:px-6 lg:pt-3">
        <CategoryNavigation />
        {/* 행사 목록과 같은 자리의 상태 탭. 월별이 골라져 있고, 진행중·마감은 전체 분야의 행사 목록으로 간다. */}
        <div className="mt-4 border-b border-line">
          <EventViewTabs current="month" activeHref="/" closedHref={buildEventBrowseHref(withEventBrowsePath({}, "/"), { status: "closed" })} />
        </div>
        <div className="mt-6">
          <EventMonthView month={month} category={category} events={events} previousMonth={previousMonth} nextMonth={nextMonth} now={now} />
        </div>
      </div>
    </main>
  );
}
