import { deriveApplicationState, type ApplicationState, type Event } from "./event";

const calendarMonthPattern = /^(\d{4})-(\d{2})$/;
const koreanDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type CalendarEvent = {
  id: string;
  slug: string;
  title: string;
  startDateKey: string;
  endDateKey: string;
  applicationState: ApplicationState;
};

export type CalendarDay = {
  dateKey: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  eventIds: string[];
};

export type CalendarSegment = {
  eventId: string;
  columnStart: number;
  columnSpan: number;
  lane: number;
  startsEvent: boolean;
  endsEvent: boolean;
};

export type CalendarWeek = {
  startDateKey: string;
  days: CalendarDay[];
  segments: CalendarSegment[];
  laneCount: number;
};

export type CalendarMonth = {
  monthKey: string;
  label: string;
  previousMonthKey: string;
  nextMonthKey: string;
  todayMonthKey: string;
  todayDateKey: string;
  eventCount: number;
  events: CalendarEvent[];
  days: CalendarDay[];
  weeks: CalendarWeek[];
};

export function toKoreanDateKey(value: string | Date): string | null {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const parts = koreanDateFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const year = read("year");
  const month = read("month");
  const day = read("day");
  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function resolveCalendarMonth(value: string | string[] | undefined, now = new Date()): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && isCalendarMonth(candidate)) return candidate;
  return toKoreanDateKey(now)?.slice(0, 7) ?? "1970-01";
}

export function shiftCalendarMonth(monthKey: string, offset: number): string {
  const { year, month } = parseCalendarMonth(monthKey);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`;
}

export function formatCalendarMonthLabel(monthKey: string): string {
  const { year, month } = parseCalendarMonth(monthKey);
  return `${year}년 ${month}월`;
}

export function formatCalendarDateLabel(dateKey: string, includeYear = false): string {
  const { year, month, day } = parseDateKey(dateKey);
  return includeYear ? `${year}년 ${month}월 ${day}일` : `${month}월 ${day}일`;
}

export function formatCalendarDateRange(startDateKey: string, endDateKey: string): string {
  if (startDateKey === endDateKey) return formatCalendarDateLabel(startDateKey, true);
  return `${formatCalendarDateLabel(startDateKey, true)} ~ ${formatCalendarDateLabel(endDateKey, true)}`;
}

export function buildCalendarMonth(events: Event[], monthKey: string, now = new Date()): CalendarMonth {
  const normalizedMonth = isCalendarMonth(monthKey) ? monthKey : resolveCalendarMonth(undefined, now);
  const monthStartKey = `${normalizedMonth}-01`;
  const nextMonthKey = shiftCalendarMonth(normalizedMonth, 1);
  const monthEndKey = addDays(`${nextMonthKey}-01`, -1);
  const gridStartKey = addDays(monthStartKey, -dayOfWeek(monthStartKey));
  const todayDateKey = toKoreanDateKey(now) ?? monthStartKey;
  const days: CalendarDay[] = Array.from({ length: 42 }, (_, index) => {
    const dateKey = addDays(gridStartKey, index);
    return {
      dateKey,
      dayOfMonth: parseDateKey(dateKey).day,
      inCurrentMonth: dateKey.startsWith(normalizedMonth),
      isToday: dateKey === todayDateKey,
      eventIds: [],
    } satisfies CalendarDay;
  });
  const gridEndKey = days.at(-1)?.dateKey ?? monthEndKey;

  const calendarEvents = events
    .filter((event) => event.reviewStatus === "published")
    .map((event) => toCalendarEvent(event, now))
    .filter((event): event is CalendarEvent => event != null)
    .filter((event) => rangesOverlap(event.startDateKey, event.endDateKey, gridStartKey, gridEndKey))
    .sort(compareCalendarEvents);

  for (const day of days) {
    day.eventIds = calendarEvents
      .filter((event) => event.startDateKey <= day.dateKey && event.endDateKey >= day.dateKey)
      .map((event) => event.id);
  }

  const weeks = Array.from({ length: 6 }, (_, index) => {
    const weekDays = days.slice(index * 7, index * 7 + 7);
    return buildCalendarWeek(weekDays, calendarEvents);
  });
  const eventCount = calendarEvents.filter((event) => (
    rangesOverlap(event.startDateKey, event.endDateKey, monthStartKey, monthEndKey)
  )).length;

  return {
    monthKey: normalizedMonth,
    label: formatCalendarMonthLabel(normalizedMonth),
    previousMonthKey: shiftCalendarMonth(normalizedMonth, -1),
    nextMonthKey,
    todayMonthKey: todayDateKey.slice(0, 7),
    todayDateKey,
    eventCount,
    events: calendarEvents,
    days,
    weeks,
  };
}

function toCalendarEvent(event: Event, now: Date): CalendarEvent | null {
  const startDateKey = toKoreanDateKey(event.eventStartAt);
  if (!startDateKey) return null;
  const rawEndDateKey = toKoreanDateKey(event.eventEndAt ?? event.eventStartAt) ?? startDateKey;
  const endDateKey = rawEndDateKey < startDateKey ? startDateKey : rawEndDateKey;
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    startDateKey,
    endDateKey,
    applicationState: deriveApplicationState(event, now),
  };
}

function buildCalendarWeek(days: CalendarDay[], events: CalendarEvent[]): CalendarWeek {
  const startDateKey = days[0]?.dateKey ?? "1970-01-01";
  const endDateKey = days.at(-1)?.dateKey ?? startDateKey;
  const candidates = events
    .filter((event) => rangesOverlap(event.startDateKey, event.endDateKey, startDateKey, endDateKey))
    .map((event) => {
      const segmentStart = event.startDateKey < startDateKey ? startDateKey : event.startDateKey;
      const segmentEnd = event.endDateKey > endDateKey ? endDateKey : event.endDateKey;
      const columnStart = daysBetween(startDateKey, segmentStart);
      return {
        event,
        segmentStart,
        segmentEnd,
        columnStart,
        columnSpan: daysBetween(segmentStart, segmentEnd) + 1,
      };
    })
    .sort((a, b) => (
      a.columnStart - b.columnStart
      || b.columnSpan - a.columnSpan
      || compareCalendarEvents(a.event, b.event)
    ));

  const laneEnds: number[] = [];
  const segments = candidates.map((candidate) => {
    let lane = laneEnds.findIndex((lastColumn) => lastColumn < candidate.columnStart);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = candidate.columnStart + candidate.columnSpan - 1;
    return {
      eventId: candidate.event.id,
      columnStart: candidate.columnStart,
      columnSpan: candidate.columnSpan,
      lane,
      startsEvent: candidate.segmentStart === candidate.event.startDateKey,
      endsEvent: candidate.segmentEnd === candidate.event.endDateKey,
    } satisfies CalendarSegment;
  });

  return { startDateKey, days, segments, laneCount: laneEnds.length };
}

function compareCalendarEvents(a: CalendarEvent, b: CalendarEvent) {
  const aDuration = daysBetween(a.startDateKey, a.endDateKey);
  const bDuration = daysBetween(b.startDateKey, b.endDateKey);
  return a.startDateKey.localeCompare(b.startDateKey)
    || bDuration - aDuration
    || a.title.localeCompare(b.title, "ko-KR")
    || a.id.localeCompare(b.id);
}

function isCalendarMonth(value: string) {
  const match = calendarMonthPattern.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1000 && month >= 1 && month <= 12;
}

function parseCalendarMonth(monthKey: string) {
  if (!isCalendarMonth(monthKey)) throw new Error(`올바르지 않은 달력 월입니다: ${monthKey}`);
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

function toUtcCalendarDate(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(dateKey: string, amount: number) {
  const date = toUtcCalendarDate(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function daysBetween(startDateKey: string, endDateKey: string) {
  return Math.round((toUtcCalendarDate(endDateKey).getTime() - toUtcCalendarDate(startDateKey).getTime()) / 86_400_000);
}

function dayOfWeek(dateKey: string) {
  return toUtcCalendarDate(dateKey).getUTCDay();
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && aEnd >= bStart;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
