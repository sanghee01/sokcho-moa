import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button-styles";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import { EventMonthLinks } from "@/features/events/components/month/event-month-links";
import type { Event } from "@/features/events/model/event";
import { partitionMonthEvents, type EventMonth } from "@/features/events/model/event-month";

function MonthEventSection({ id, title, events }: { id: string; title: string; events: Event[] }) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-8 lg:mt-12">
      <h2 id={id} className="text-title-2 text-content-strong">{title}</h2>
      <div className={`mt-4 ${eventCardGridClassName}`}>
        {events.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </section>
  );
}

/**
 * 월별 행사 페이지 본문(.ai/DESIGN.md 페이지 구조 > 월별 행사). 홈·주제 목록과 달리 제목과 요약 문장을 화면에 보여 준다.
 * "11월 속초 행사" 같은 질문에 검색 결과·AI 개요가 그대로 인용할 수 있는 글이 이 페이지의 목적이라서다(2026-11-15 사용자 결정).
 * 아직 참여할 수 있는 행사를 먼저, 끝난 행사를 아래에 둔다.
 */
export function EventMonthView({
  title,
  summary,
  events,
  otherMonths,
  now,
}: {
  title: string;
  summary: string;
  events: Event[];
  otherMonths: EventMonth[];
  now: Date;
}) {
  const { current, ended } = partitionMonthEvents(events, now);

  return (
    <>
      <h1 className="text-title-1 text-balance text-content-strong lg:text-title-1-lg">{title}</h1>
      {events.length === 0 ? (
        <div className="mt-6 rounded-card bg-surface-subtle px-6 py-12 text-center">
          <p className="text-title-3 text-content-strong">아직 올라온 일정이 없어요</p>
          <p className="mt-2 text-body text-content-muted">새 일정이 올라오면 여기에 보여 드릴게요.</p>
          <Link href="/" className={`${getButtonClassName({ variant: "secondary" })} mt-6`}>진행 중인 행사 보기</Link>
        </div>
      ) : (
        <p className="mt-3 max-w-160 text-body text-content-muted">{summary}</p>
      )}
      <MonthEventSection id="month-current-events" title="진행 중·예정 행사" events={current} />
      <MonthEventSection id="month-ended-events" title="끝난 행사" events={ended} />
      <EventMonthLinks months={otherMonths} label="다른 달 행사" className="mt-12" />
    </>
  );
}
