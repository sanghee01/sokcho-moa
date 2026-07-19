import type { ApplicationState, EventAudience, EventCategory, EventState } from "./event";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
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
  return value ? dateFormatter.format(new Date(value)) : "확인 필요";
}

export function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "확인 필요";
}

export function formatDateRange(start: string, end: string | null) {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  return end && startLabel !== endLabel ? `${startLabel} – ${endLabel}` : startLabel;
}
