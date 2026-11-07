import { fromSeoulWallClock, toSeoulWallClock } from "@/lib/seoul-time";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** 관리자 폼의 날짜 칸과 시간 칸(비어 있을 수 있음)을 한 값으로 합친다. 시간이 없으면 날짜만 남는다. */
export function combineDateAndOptionalTime(date: string, time: string) {
  if (!date) return time ? `T${time}` : "";
  if (date.includes("T") || !time) return date;
  return `${date}T${time}`;
}

/** datetime-local 값(서울 시각)을 UTC ISO 문자열로 바꾼다. 2월 30일처럼 없는 날짜는 오류로 막는다. */
export function seoulDatetimeLocalToIso(value: string) {
  const match = DATETIME_LOCAL_PATTERN.exec(value);
  if (!match) throw new Error("올바른 날짜와 시간을 입력하세요.");

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new Error("올바른 날짜와 시간을 입력하세요.");
  }

  const instant = fromSeoulWallClock({ year, month, day, hour, minute });
  if (isoToSeoulDatetimeLocal(instant.toISOString()) !== value) {
    throw new Error("올바른 날짜와 시간을 입력하세요.");
  }
  return instant.toISOString();
}

/**
 * 날짜만 또는 날짜·시간 값을 UTC ISO 문자열로 바꾼다.
 * 날짜만 입력한 종료(`end`)는 그날 23:59:59.999(서울)로 저장해 그날 하루 전체를 포함한다.
 */
export function seoulDateOrDatetimeToIso(value: string, dateOnlyBoundary: "start" | "end" = "start") {
  if (DATETIME_LOCAL_PATTERN.test(value)) return seoulDatetimeLocalToIso(value);
  if (!DATE_ONLY_PATTERN.test(value)) throw new Error("올바른 날짜를 입력하세요.");
  const boundary = seoulDatetimeLocalToIso(`${value}T${dateOnlyBoundary === "end" ? "23:59" : "00:00"}`);
  if (dateOnlyBoundary === "start") return boundary;
  return new Date(new Date(boundary).getTime() + 59_999).toISOString();
}

/** 저장된 ISO 문자열을 datetime-local 칸이 받는 분 단위 서울 시각으로 바꾼다. */
export function isoToSeoulDatetimeLocal(value: string) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "";
  const seoul = toSeoulWallClock(instant);
  return [
    `${seoul.year}-${pad(seoul.month)}-${pad(seoul.day)}`,
    `${pad(seoul.hour)}:${pad(seoul.minute)}`,
  ].join("T");
}
