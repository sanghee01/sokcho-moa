import { isoToSeoulDatetimeLocal } from "@/features/events/admin/datetime";

/** 수정 화면에서 받은 DB 행. 새 행사는 null. 폼 기본값을 꺼내는 helper만 둔다. */
export type EventRow = Record<string, unknown> | null;

export const text = (row: EventRow, key: string) => row?.[key] == null ? "" : String(row[key]);

export const listText = (row: EventRow, key: string) => Array.isArray(row?.[key])
  ? row[key].map(String).join("\n")
  : "";

export const checked = (row: EventRow, key: string) => row?.[key] === true;

/** DB의 UTC 시각을 서울 기준 datetime-local 입력값으로 바꾼다. */
export const dateValue = (row: EventRow, key: string) => {
  const raw = text(row, key);
  return raw ? isoToSeoulDatetimeLocal(raw) : "";
};
