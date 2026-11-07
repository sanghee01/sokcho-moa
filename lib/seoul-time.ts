// 서울(Asia/Seoul) 시간 계산의 원본. 행사 날짜 경계(오늘·마감일·종료일), 목록 기간 필터, 관리자 날짜 입력이 모두 이 계산을 쓴다.
// 예전에는 행사 model, 표시 형식, 관리자 입력, 관리자 카드 두 곳이 각자 구현했다(2026-11-06 한 곳으로 모음).
// 한국은 1988년 이후 서머타임이 없어 UTC+9 고정 차이로 계산한다.

export const SEOUL_TIME_ZONE = "Asia/Seoul";
export const DAY_MS = 24 * 60 * 60 * 1_000;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1_000;

export interface SeoulDateParts {
  year: number;
  month: number;
  day: number;
}

export interface SeoulDateTimeParts extends SeoulDateParts {
  hour: number;
  minute: number;
}

const seoulDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SEOUL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const seoulDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: SEOUL_TIME_ZONE,
});

/** 그 시각이 서울 달력으로 몇 년 몇 월 며칠인지 */
export function getSeoulDateParts(date: Date): SeoulDateParts {
  const parts = seoulDatePartsFormatter.formatToParts(date);
  function value(type: Intl.DateTimeFormatPartTypes) {
    return Number(parts.find((part) => part.type === type)?.value);
  }
  return { year: value("year"), month: value("month"), day: value("day") };
}

/** 서울 날짜의 0시 정각. month·day가 범위를 넘으면 다음 달·다음 해로 넘어간다(예: 13월 → 다음 해 1월). */
export function getSeoulMidnight(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - SEOUL_OFFSET_MS);
}

export function isSameSeoulDate(a: Date, b: Date) {
  const ap = getSeoulDateParts(a);
  const bp = getSeoulDateParts(b);
  return ap.year === bp.year && ap.month === bp.month && ap.day === bp.day;
}

/** 두 시각 사이의 서울 달력 날짜 차이. 밤 11시 30분과 다음 날 0시 30분은 1일이다(시간 차이가 아니라 날짜 차이). */
export function seoulDaysBetween(from: Date, to: Date) {
  const a = getSeoulDateParts(from);
  const b = getSeoulDateParts(to);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS);
}

/** 서울 벽시계 시각(예: 관리자가 입력한 2026-11-06 18:30)을 실제 시각으로 */
export function fromSeoulWallClock({ year, month, day, hour, minute }: SeoulDateTimeParts) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - SEOUL_OFFSET_MS);
}

/** 실제 시각을 서울 벽시계 시각으로 */
export function toSeoulWallClock(instant: Date): SeoulDateTimeParts {
  const seoul = new Date(instant.getTime() + SEOUL_OFFSET_MS);
  return {
    year: seoul.getUTCFullYear(),
    month: seoul.getUTCMonth() + 1,
    day: seoul.getUTCDate(),
    hour: seoul.getUTCHours(),
    minute: seoul.getUTCMinutes(),
  };
}

/** 관리자 화면의 기록 시각 표기(예: "2026. 11. 6. 오후 6:30") */
export function formatSeoulDateTime(date: Date) {
  return seoulDateTimeFormatter.format(date);
}
