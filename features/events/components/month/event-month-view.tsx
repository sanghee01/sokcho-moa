import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import type { Event } from "@/features/events/model/event";
import {
  eventMonthPath,
  formatEventMonthLabel,
  partitionMonthEvents,
  type EventMonth,
} from "@/features/events/model/event-month";
import { categoryLabels, type EventCategory } from "@/features/events/model/taxonomy";

/** 달을 넘기는 정사각형 화살표(44×44px). 보조 행동이라 흰 바탕 + 테두리(secondary)와 같은 모양이다. */
const monthArrowClassName =
  "pointer-events-auto inline-flex size-11 items-center justify-center rounded-control border border-line-strong bg-surface text-content-strong hover:bg-surface-subtle";

function MonthArrow({ month, category, direction }: { month: EventMonth; category?: EventCategory; direction: "previous" | "next" }) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <Link
      // 고른 분야는 달을 넘겨도 유지한다(10월 교육 → 12월 교육).
      href={eventMonthPath(month, category)}
      aria-label={`${formatEventMonthLabel(month)} 행사 보기`}
      // 이전 달이 없으면 다음 달 화살표 혼자 남으므로 오른쪽 끝으로 민다.
      className={`${monthArrowClassName} ${direction === "next" ? "ml-auto" : ""}`}
    >
      <Icon {...iconProps} />
    </Link>
  );
}

// 분야를 고른 페이지에서는 카드에 분야를 다시 쓰지 않는다(주제 페이지와 같은 규칙, .ai/DESIGN.md EventCard).
function MonthEventSection({ id, title, events, showCategory }: { id: string; title: string; events: Event[]; showCategory: boolean }) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-8 lg:mt-12">
      <h2 id={id} className="text-title-2 text-content-strong">{title}</h2>
      <div className={`mt-4 ${eventCardGridClassName}`}>
        {events.map((event) => <EventCard key={event.id} event={event} showCategory={showCategory} />)}
      </div>
    </section>
  );
}

/**
 * 월별 행사 페이지 본문(.ai/DESIGN.md 페이지 구조 > 월별 행사). 화면에는 제목과 행사 카드만 둔다.
 * 행사 수·"오늘 기준" 같은 요약 문장은 방문자에게 필요 없어 화면에 쓰지 않고 검색 설명에만 쓴다(2026-11-15 사용자 결정).
 * 맨 위는 "‹ 2026년 11월 ›" 달 넘기기다. 열지 않는 달 쪽 화살표는 두지 않는다.
 * 연·월 드롭다운은 열리는 달이 몇 개뿐이라 쓰지 않는다(2026-11-15 사용자 결정).
 * 아직 참여할 수 있는 행사를 먼저, 끝난 행사를 아래에 둔다.
 */
export function EventMonthView({
  month,
  category,
  events,
  previousMonth,
  nextMonth,
  now,
}: {
  month: EventMonth;
  category?: EventCategory;
  events: Event[];
  previousMonth: EventMonth | null;
  nextMonth: EventMonth | null;
  now: Date;
}) {
  const { current, ended } = partitionMonthEvents(events, now);

  return (
    <>
      {/* 제목을 가운데 두고 화살표를 양 끝에 겹쳐 놓는다. 제목이 두 줄이 되어도 화살표는 세로 가운데에 온다. */}
      <div className="relative px-14 text-center">
        <h1 className="text-balance">
          <span className="block text-title-1 text-content-strong lg:text-title-1-lg">{formatEventMonthLabel(month)}</span>{" "}
          <span className="mt-1 block text-label text-content-muted">속초 {category ? categoryLabels[category] : "행사"} 일정</span>
        </h1>
        <nav aria-label="다른 달" className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2">
          {previousMonth !== null && <MonthArrow month={previousMonth} category={category} direction="previous" />}
          {nextMonth !== null && <MonthArrow month={nextMonth} category={category} direction="next" />}
        </nav>
      </div>
      {events.length === 0 && (
        <div className="mt-6 rounded-card bg-surface-subtle px-6 py-12 text-center">
          <p className="text-title-3 text-content-strong">아직 올라온 일정이 없어요</p>
          <p className="mt-2 text-body text-content-muted">새 일정이 올라오면 여기에 보여 드릴게요.</p>
          <TransitionLink href="/" pendingLabel="행사 목록 불러오는 중" showPendingIndicator={false} className={`${getButtonClassName({ variant: "secondary" })} mt-6`}>진행 중인 행사 보기</TransitionLink>
        </div>
      )}
      <MonthEventSection id="month-current-events" title="진행 중·예정 행사" events={current} showCategory={!category} />
      <MonthEventSection id="month-ended-events" title="끝난 행사" events={ended} showCategory={!category} />
    </>
  );
}
