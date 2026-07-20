"use client";

import { useState } from "react";
import Link from "next/link";
import { TransitionLink } from "@/components/transition-link";
import { applicationStateLabels } from "@/lib/domain/format";
import { analyticsData } from "@/lib/analytics/events";
import type { ApplicationState } from "@/lib/domain/event";
import type { CalendarDay, CalendarEvent, CalendarMonth, CalendarWeek } from "@/lib/domain/calendar";
import { buildEventBrowseHref, type EventSearchParams } from "@/lib/domain/event-navigation";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"] as const;
const legendStates: ApplicationState[] = ["open", "closing_today", "closed", "upcoming", "not_applicable"];

const segmentTone: Record<ApplicationState, string> = {
  open: "bg-emerald-50 text-slate-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100",
  closing_today: "bg-rose-50 text-slate-800 ring-1 ring-inset ring-rose-200 hover:bg-rose-100",
  closed: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-200",
  upcoming: "bg-sky-50 text-slate-800 ring-1 ring-inset ring-sky-200 hover:bg-sky-100",
  not_applicable: "bg-teal-50 text-slate-800 ring-1 ring-inset ring-teal-200 hover:bg-teal-100",
};

const badgeTone: Record<ApplicationState, string> = {
  open: "bg-emerald-50 text-slate-800 ring-emerald-200",
  closing_today: "bg-rose-50 text-slate-800 ring-rose-200",
  closed: "bg-slate-100 text-slate-700 ring-slate-200",
  upcoming: "bg-sky-50 text-slate-800 ring-sky-200",
  not_applicable: "bg-teal-50 text-slate-800 ring-teal-200",
};

const indicatorTone: Record<ApplicationState, string> = {
  open: "bg-emerald-400",
  closing_today: "bg-rose-400",
  closed: "bg-slate-400",
  upcoming: "bg-sky-400",
  not_applicable: "bg-teal-400",
};

export function EventCalendar({ month, params }: { month: CalendarMonth; params: EventSearchParams }) {
  const eventsById = new Map(month.events.map((event) => [event.id, event]));
  const firstEventDate = month.days.find((day) => day.inCurrentMonth && day.eventIds.length > 0)?.dateKey;
  const firstMonthDate = month.days.find((day) => day.inCurrentMonth)?.dateKey ?? `${month.monthKey}-01`;
  const initialDate = month.todayMonthKey === month.monthKey ? month.todayDateKey : (firstEventDate ?? firstMonthDate);
  const [selectedDateKey, setSelectedDateKey] = useState(initialDate);
  const selectedDay = month.days.find((day) => day.dateKey === selectedDateKey)
    ?? month.days.find((day) => day.inCurrentMonth)
    ?? month.days[0];

  return (
    <section aria-labelledby="calendar-month-title" className="space-y-6">
      <CalendarToolbar month={month} params={params} />
      <CalendarLegend />

      {month.eventCount === 0 && (
        <div className="rounded-3xl border border-dashed border-teal-300 bg-white px-6 py-10 text-center">
          <p className="text-xl font-black text-slate-950">이 달에 등록된 행사가 아직 없어요.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">이전 달이나 다음 달을 살펴보거나 행사 목록에서 다른 조건을 찾아보세요.</p>
          <TransitionLink
            href={buildEventBrowseHref(params, { view: undefined, month: undefined })}
            className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white"
          >
            행사 목록으로 돌아가기
          </TransitionLink>
        </div>
      )}

      <div data-calendar-desktop className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50" aria-hidden="true">
          {weekdays.map((weekday, index) => (
            <div key={weekday} className={`px-3 py-3 text-center text-sm font-black ${index === 0 ? "text-rose-700" : index === 6 ? "text-sky-700" : "text-slate-600"}`}>
              {weekday}요일
            </div>
          ))}
        </div>
        {month.weeks.map((week) => (
          <DesktopCalendarWeek key={week.startDateKey} week={week} eventsById={eventsById} />
        ))}
      </div>

      <div data-calendar-mobile className="space-y-5 md:hidden">
        <MobileDatePicker
          days={month.days}
          eventsById={eventsById}
          selectedDateKey={selectedDay?.dateKey ?? initialDate}
          onSelect={setSelectedDateKey}
        />
        {selectedDay && <MobileAgenda day={selectedDay} eventsById={eventsById} />}
      </div>
    </section>
  );
}

function CalendarToolbar({ month, params }: { month: CalendarMonth; params: EventSearchParams }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="text-sm font-bold text-teal-700">월간 일정</p>
        <h2 id="calendar-month-title" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{month.label}</h2>
        <p className="mt-1 text-sm text-slate-600">이 달에 실제 운영 일정이 있는 행사 {month.eventCount}개</p>
      </div>
      <nav aria-label="달력 월 이동" className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
        <TransitionLink
          href={buildEventBrowseHref(params, { view: "calendar", month: month.previousMonthKey })}
          {...analyticsData("calendar_month_changed", { direction: "previous", target_month: month.previousMonthKey })}
          pendingLabel="이전 달 불러오는 중"
          scroll={false}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <span aria-hidden="true">←</span> 이전 달
        </TransitionLink>
        {month.monthKey === month.todayMonthKey ? (
          <span aria-current="date" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-teal-50 px-3 py-2 text-sm font-black text-teal-800 ring-1 ring-teal-200">
            이번 달
          </span>
        ) : (
          <TransitionLink
            href={buildEventBrowseHref(params, { view: "calendar", month: month.todayMonthKey })}
            {...analyticsData("calendar_month_changed", { direction: "current", target_month: month.todayMonthKey })}
            pendingLabel="이번 달 불러오는 중"
            scroll={false}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-teal-50 px-3 py-2 text-sm font-black text-teal-800 ring-1 ring-teal-200 hover:bg-teal-100"
          >
            이번 달
          </TransitionLink>
        )}
        <TransitionLink
          href={buildEventBrowseHref(params, { view: "calendar", month: month.nextMonthKey })}
          {...analyticsData("calendar_month_changed", { direction: "next", target_month: month.nextMonthKey })}
          pendingLabel="다음 달 불러오는 중"
          scroll={false}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          다음 달 <span aria-hidden="true">→</span>
        </TransitionLink>
      </nav>
    </div>
  );
}

function CalendarLegend() {
  return (
    <div aria-label="신청 상태 범례" className="flex flex-wrap gap-2 text-sm font-bold">
      {legendStates.map((state) => (
        <span key={state} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ${badgeTone[state]}`}>
          <span aria-hidden="true" className={`size-2 rounded-full ${indicatorTone[state]}`} />
          {applicationStateLabels[state]}
        </span>
      ))}
    </div>
  );
}

function DesktopCalendarWeek({ week, eventsById }: { week: CalendarWeek; eventsById: Map<string, CalendarEvent> }) {
  const visibleLaneCount = Math.max(week.laneCount, 1);
  return (
    <div
      aria-label={`${formatKoreanDate(week.startDateKey)}부터 한 주`}
      className="relative grid grid-cols-7 border-b border-slate-200 last:border-b-0"
      style={{ gridTemplateRows: `2.75rem repeat(${visibleLaneCount}, 2rem) 0.5rem` }}
    >
      {week.days.map((day, index) => (
        <div
          key={day.dateKey}
          aria-label={dayAriaLabel(day, eventsById)}
          className={`relative z-0 border-r border-slate-100 p-2 ${index === 6 ? "border-r-0" : ""} ${day.inCurrentMonth ? "bg-white" : "bg-slate-50/80"}`}
          style={{ gridColumn: index + 1, gridRow: "1 / -1" }}
        >
          <time
            dateTime={day.dateKey}
            className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-black ${day.isToday ? "bg-teal-800 text-white" : day.inCurrentMonth ? "text-slate-800" : "text-slate-400"}`}
          >
            {day.dayOfMonth}
          </time>
        </div>
      ))}
      {week.segments.map((segment) => {
        const event = eventsById.get(segment.eventId);
        if (!event) return null;
        const rounded = segment.startsEvent && segment.endsEvent
          ? "rounded-lg"
          : segment.startsEvent
            ? "rounded-l-lg"
            : segment.endsEvent
              ? "rounded-r-lg"
              : "rounded-none";
        return (
          <Link
            key={segment.key}
            href={`/events/${event.slug}`}
            aria-label={`${event.title}, ${formatDateRange(segment.startDateKey, segment.endDateKey)}, ${applicationStateLabels[event.applicationState]}`}
            data-event-slug={event.slug}
            data-calendar-span={segment.columnSpan}
            {...analyticsData("select_content", { content_type: "event", content_id: event.slug, content_source: "calendar_desktop" })}
            className={`relative z-10 mx-0.5 flex h-8 min-w-0 items-center gap-1 self-center overflow-hidden px-2.5 text-xs font-black shadow-sm focus-visible:z-20 ${rounded} ${segmentTone[event.applicationState]}`}
            style={{ gridColumn: `${segment.columnStart + 1} / span ${segment.columnSpan}`, gridRow: segment.lane + 2 }}
          >
            <span className="truncate">{event.title}</span>
            <span className="ml-auto shrink-0 rounded bg-white/80 px-1.5 py-0.5 text-[10px] leading-none text-slate-900">
              {applicationStateLabels[event.applicationState]}
            </span>
            <span className="sr-only">, {formatDateRange(segment.startDateKey, segment.endDateKey)}</span>
          </Link>
        );
      })}
    </div>
  );
}

function MobileDatePicker({
  days,
  eventsById,
  selectedDateKey,
  onSelect,
}: {
  days: CalendarDay[];
  eventsById: Map<string, CalendarEvent>;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
}) {
  return (
    <section aria-label="날짜 선택" className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-7" aria-hidden="true">
        {weekdays.map((weekday, index) => (
          <div key={weekday} className={`py-2 text-center text-xs font-black ${index === 0 ? "text-rose-700" : index === 6 ? "text-sky-700" : "text-slate-500"}`}>
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          if (!day.inCurrentMonth) {
            return <span key={day.dateKey} aria-hidden="true" className="min-h-14 rounded-xl bg-slate-50" />;
          }
          const states = uniqueStates(day.eventIds, eventsById).slice(0, 3);
          const selected = day.dateKey === selectedDateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              aria-label={dayAriaLabel(day, eventsById)}
              aria-pressed={selected}
              onClick={() => onSelect(day.dateKey)}
              {...analyticsData("calendar_date_selected", { selected_date: day.dateKey, event_count: day.eventIds.length })}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-1.5 transition active:scale-[0.97] ${selected ? "border-teal-700 bg-teal-50 text-teal-950 ring-2 ring-teal-200" : "border-transparent bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <time dateTime={day.dateKey} className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-black ${day.isToday ? "bg-teal-800 text-white" : ""}`}>
                {day.dayOfMonth}
              </time>
              <span aria-hidden="true" className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                {states.map((state) => <span key={state} className={`h-1.5 w-2 rounded-full ${indicatorTone[state]}`} />)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MobileAgenda({ day, eventsById }: { day: CalendarDay; eventsById: Map<string, CalendarEvent> }) {
  const events = day.eventIds.map((id) => eventsById.get(id)).filter((event): event is CalendarEvent => event != null);
  return (
    <section aria-labelledby="selected-date-title" aria-live="polite" className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-teal-700">선택한 날짜</p>
          <h3 id="selected-date-title" className="mt-1 text-2xl font-black text-slate-950">{formatKoreanDate(day.dateKey)}</h3>
        </div>
        <p className="shrink-0 text-sm font-bold text-slate-500">행사 {events.length}개</p>
      </div>
      {events.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.slug}`}
                data-event-slug={event.slug}
                {...analyticsData("select_content", { content_type: "event", content_id: event.slug, content_source: "calendar_mobile" })}
                className="block min-h-11 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50 active:scale-[0.99]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 font-black leading-6 text-slate-950">{event.title}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${badgeTone[event.applicationState]}`}>
                    {applicationStateLabels[event.applicationState]}
                  </span>
                </div>
                <span className="mt-2 block text-sm leading-6 text-slate-600">{formatAgendaDateRange(event, day.dateKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <p className="font-black text-slate-800">이 날짜에는 등록된 행사가 없어요.</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">행사 표시가 있는 다른 날짜를 눌러보세요.</p>
        </div>
      )}
    </section>
  );
}

function uniqueStates(eventIds: string[], eventsById: Map<string, CalendarEvent>) {
  return [...new Set(eventIds.map((id) => eventsById.get(id)?.applicationState).filter((state): state is ApplicationState => state != null))];
}

function dayAriaLabel(day: CalendarDay, eventsById: Map<string, CalendarEvent>) {
  const stateLabels = uniqueStates(day.eventIds, eventsById).map((state) => applicationStateLabels[state]);
  const status = stateLabels.length > 0 ? `, ${stateLabels.join(", ")}` : "";
  const today = day.isToday ? ", 오늘" : "";
  return `${formatKoreanDate(day.dateKey)}, 행사 ${day.eventIds.length}개${status}${today}`;
}

function formatKoreanDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function formatDateRange(startDateKey: string, endDateKey: string) {
  if (startDateKey === endDateKey) return formatKoreanDate(startDateKey);
  return `${formatKoreanDate(startDateKey)} ~ ${formatKoreanDate(endDateKey)}`;
}

function formatAgendaDateRange(event: CalendarEvent, selectedDateKey: string) {
  if (event.scheduleMode === "continuous") return formatDateRange(event.startDateKey, event.endDateKey);
  const range = event.dateRanges.find((candidate) => (
    candidate.startDateKey <= selectedDateKey && candidate.endDateKey >= selectedDateKey
  ));
  return range ? formatDateRange(range.startDateKey, range.endDateKey) : formatKoreanDate(selectedDateKey);
}
