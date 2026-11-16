// 지도 탭의 주소(?category=, ?place=)와 브라우저 기록. 분야와 장소를 주소에 남겨 상세에서 뒤로 오면 같은 화면으로 돌아오고,
// 브라우저 뒤로 가기로 장소 카드를 닫는다(.ai/DESIGN.md 지도). 주소를 바꾸면 Next.js가 useSearchParams에 반영한다.
import type { EventCategory } from "@/features/events/model/taxonomy";

/**
 * 장소 카드를 열면서 쌓은 기록 칸의 표시. 닫기 버튼은 이 표시가 있으면 뒤로 가기로 그 칸을 지워 기록이 남지 않게 한다.
 * 예전에는 표시를 컴포넌트 ref에 두어, 상세에서 뒤로 오거나 새로 고친 뒤 닫으면 같은 /map 칸이 두 번 남았다(2026-11-16 리뷰).
 * 기록에 둔 값은 Next.js가 뒤로·앞으로 가기 때 그대로 둔다(app-router-state의 preserveCustomHistoryState).
 */
const PLACE_PUSHED_STATE_KEY = "sokchoMoaMapPlacePushed";

interface MapQuery {
  category: EventCategory | null;
  placeId: string | null;
}

/** 장소 카드를 연다. 카드가 닫혀 있었으면 기록을 한 칸 쌓아 뒤로 가기로 닫히게 하고, 다른 장소로 바꾸면 그 칸을 고쳐 쓴다. */
export function openMapPlace(query: MapQuery & { placeId: string }, isPlaceOpen: boolean) {
  if (isPlaceOpen) {
    window.history.replaceState(isPlacePushedEntry() ? { [PLACE_PUSHED_STATE_KEY]: true } : null, "", createMapUrl(query));
  } else {
    window.history.pushState({ [PLACE_PUSHED_STATE_KEY]: true }, "", createMapUrl(query));
  }
}

/** 장소 카드를 닫는다. 연 칸이면 뒤로 가기, 주소로 바로 연 카드면 주소에서 장소만 뺀다. */
export function closeMapPlace(category: EventCategory | null) {
  if (isPlacePushedEntry()) window.history.back();
  else replaceMapQuery({ category, placeId: null });
}

/**
 * 기록을 쌓지 않고 주소만 바꾼다(분야 바꾸기, 지도에 없는 장소 빼기). 카드를 연 칸의 표시도 지운다:
 * 분야를 바꾼 뒤 뒤로 가기로 카드를 닫으면 카드를 열기 전 칸(바꾸기 전 분야)으로 돌아가 고른 분야가 사라졌다(2026-11-16 리뷰).
 */
export function replaceMapQuery(query: MapQuery) {
  window.history.replaceState(null, "", createMapUrl(query));
}

function isPlacePushedEntry() {
  const state: unknown = window.history.state;
  return typeof state === "object" && state !== null && PLACE_PUSHED_STATE_KEY in state && state[PLACE_PUSHED_STATE_KEY] === true;
}

function createMapUrl({ category, placeId }: MapQuery) {
  const params = new URLSearchParams();
  if (category !== null) params.set("category", category);
  if (placeId !== null) params.set("place", placeId);
  const query = params.toString();
  return query ? `?${query}` : window.location.pathname;
}
