import type { AdminEventRow } from "@/features/events/admin/mappers";
import { isoToSeoulDatetimeLocal } from "@/features/events/admin/datetime";

/** 수정 화면에서 받은 DB 행. 새 행사는 null. 폼 기본값을 꺼내는 helper만 둔다. */
export type EventRow = AdminEventRow | null;

/** 컬럼 이름을 생성 타입의 key로 받아, 컬럼 이름이 바뀌면 typecheck가 잡는다. */
type EventColumn = keyof AdminEventRow;

export function text(row: EventRow, key: EventColumn) {
  return row?.[key] == null ? "" : String(row[key]);
}

export function listText(row: EventRow, key: EventColumn) {
  const value = row?.[key];
  return Array.isArray(value) ? value.map(String).join("\n") : "";
}

export function checked(row: EventRow, key: EventColumn) {
  return row?.[key] === true;
}

/** DB의 UTC 시각을 서울 기준 datetime-local 입력값으로 바꾼다. */
export function dateValue(row: EventRow, key: EventColumn) {
  const raw = text(row, key);
  return raw ? isoToSeoulDatetimeLocal(raw) : "";
}
