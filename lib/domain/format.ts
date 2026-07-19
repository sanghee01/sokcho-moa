import type { ApplicationState, EventAudience, EventCategory, EventState } from "./event";

const datePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const categoryLabels: Record<EventCategory, string> = {
  performance: "공연",
  festival: "축제",
  experience: "체험",
  education: "교육",
  exhibition: "전시",
  other: "기타",
};

export const audienceLabels: Record<EventAudience, string> = {
  child: "아동",
  youth: "청소년",
  family: "가족",
  adult: "성인",
  all: "누구나",
};

export const eventStateLabels: Record<EventState, string> = {
  upcoming: "예정",
  ongoing: "진행 중",
  ended: "종료",
};

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

export function formatDateTime(value: string | null) {
  if (!value) return "확인 필요";
  const parts = getDateParts(dateTimePartsFormatter, value);
  return parts ? `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}` : "확인 필요";
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "확인 필요";
  if (!start) return formatDate(end);
  if (!end) return formatDate(start);
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  return startLabel !== endLabel ? `${startLabel} ~ ${endLabel}` : startLabel;
}

export function formatOperatingSchedule(value: string | null) {
  return value?.trim().replace(/\s+/g, " ") || "공식 원문 확인";
}

function getDateParts(formatter: Intl.DateTimeFormat, value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const year = read("year");
  const month = read("month");
  const day = read("day");
  if (!year || !month || !day) return null;
  return { year, month, day, hour: read("hour") ?? "00", minute: read("minute") ?? "00" };
}
