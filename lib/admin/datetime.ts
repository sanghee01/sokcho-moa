const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1_000;
const datetimeLocalPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, "0");

/** Converts an Asia/Seoul wall-clock value from datetime-local into a UTC ISO timestamp. */
export function seoulDatetimeLocalToIso(value: string) {
  const match = datetimeLocalPattern.exec(value);
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

  const instant = new Date(Date.UTC(year, month - 1, day, hour, minute) - SEOUL_OFFSET_MS);
  if (isoToSeoulDatetimeLocal(instant.toISOString()) !== value) {
    throw new Error("올바른 날짜와 시간을 입력하세요.");
  }
  return instant.toISOString();
}

/** Converts a stored ISO timestamp into the minute-precision value expected by datetime-local. */
export function isoToSeoulDatetimeLocal(value: string) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "";
  const seoul = new Date(instant.getTime() + SEOUL_OFFSET_MS);
  return [
    `${seoul.getUTCFullYear()}-${pad(seoul.getUTCMonth() + 1)}-${pad(seoul.getUTCDate())}`,
    `${pad(seoul.getUTCHours())}:${pad(seoul.getUTCMinutes())}`,
  ].join("T");
}
