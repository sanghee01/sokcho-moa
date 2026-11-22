import type { Place } from "@/features/places/model/place";
import { formatSeoulIsoDate } from "@/lib/seoul-time";

/**
 * 화면에 보일 운영 안내. 끝나는 날(statusNoteUntil)이 지나면(서울 기준 그날 자정 이후) 숨긴다.
 * "12월 10일까지만 운영" 같은 안내가 사람이 지우기 전까지 틀린 채 남던 문제를 막는다(2026-11-22 사용자 결정).
 * 운영 상태(operationStatus)는 바꾸지 않는다. 휴장 시작·재개는 관리자가 확인한 뒤 바꾼다.
 */
export function getVisibleStatusNote(place: Pick<Place, "statusNote" | "statusNoteUntil">, now = new Date()) {
  if (place.statusNote === null) return null;
  if (place.statusNoteUntil !== null && formatSeoulIsoDate(now) > place.statusNoteUntil) return null;
  return place.statusNote;
}
