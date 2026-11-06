import type { ApplicationState } from "@/features/events/model/event";

export { audienceLabels, categoryLabels } from "@/features/events/model/taxonomy";

const datePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("ko-KR");

export const applicationStateLabels: Record<ApplicationState, string> = {
  not_applicable: "별도 신청 없음",
  upcoming: "신청 예정",
  open: "신청 가능",
  closing_today: "오늘 마감",
  closed: "신청 마감",
};

export function formatDate(value: string | null) {
  if (!value) return "확인 필요";
  const parts = getDateParts(datePartsFormatter, value);
  return parts ? `${parts.year}.${parts.month}.${parts.day}` : "확인 필요";
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "확인 필요";
  if (!start) return formatDate(end);
  if (!end) return formatDate(start);
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  return startLabel !== endLabel ? `${startLabel} ~ ${endLabel}` : startLabel;
}

const koreanWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 목록용 짧은 날짜 표기(.ai/DESIGN.md Typography > 날짜·시간 표기). 하루 행사는 "7.25 (토)",
 * 여러 날 행사는 "10.3 – 11.21". 올해(KST)가 아닌 날짜가 섞이면 연도를 붙인다.
 */
export function formatShortDateRange(start: string | null, end: string | null, now = new Date()) {
  const startParts = start ? getDateParts(datePartsFormatter, start) : null;
  if (!startParts) return "날짜 확인 필요";
  const endParts = end ? getDateParts(datePartsFormatter, end) : null;
  const currentYear = getDateParts(datePartsFormatter, now.toISOString())?.year;
  const isSameDay = !endParts
    || (endParts.year === startParts.year && endParts.month === startParts.month && endParts.day === startParts.day);
  const withYear = startParts.year !== currentYear || Boolean(endParts && endParts.year !== currentYear);
  function short(parts: NonNullable<typeof startParts>) {
    return `${withYear ? `${parts.year}.` : ""}${Number(parts.month)}.${Number(parts.day)}`;
  }

  if (isSameDay) {
    const weekday = koreanWeekdays[new Date(Date.UTC(Number(startParts.year), Number(startParts.month) - 1, Number(startParts.day))).getUTCDay()];
    return `${short(startParts)} (${weekday})`;
  }
  return `${short(startParts)} – ${short(endParts)}`;
}

/**
 * 상세 핵심 정보의 신청 기간. 목록과 같은 짧은 표기를 쓰고, 한쪽 날짜만 있으면 "…까지"·"…부터"로 보여 준다.
 * 신청 기간이 없으면 null이다(화면이 "별도 신청 없음"을 보여 준다).
 */
export function formatApplicationPeriod(start: string | null, end: string | null, now = new Date()) {
  if (start && end) return formatShortDateRange(start, end, now);
  if (end) return `${formatShortDateRange(end, null, now)}까지`;
  if (start) return `${formatShortDateRange(start, null, now)}부터`;
  return null;
}

export function formatOperatingSchedule(value: string | null) {
  if (!value?.trim()) return "행사 안내 확인";
  return value
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/[ \t]+/g, " "))
    .filter(Boolean)
    .join("\n");
}

export function formatViewCount(value?: number | null) {
  return numberFormatter.format(Math.max(0, value ?? 0));
}

function getDateParts(formatter: Intl.DateTimeFormat, value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = formatter.formatToParts(date);
  function read(type: Intl.DateTimeFormatPartTypes) {
    return parts.find((part) => part.type === type)?.value;
  }
  const year = read("year");
  const month = read("month");
  const day = read("day");
  if (!year || !month || !day) return null;
  return { year, month, day, hour: read("hour") ?? "00", minute: read("minute") ?? "00" };
}
