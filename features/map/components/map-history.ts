// 지도 탭의 주소(?layer=, ?category=, ?place=)와 브라우저 기록. 예전 공유 주소의 ?region=은 읽지 않고, 주소를 다시 쓸 때 빠진다(2026-11-22). 분야와 장소를 주소에 남겨 상세에서 뒤로 오면 같은 화면으로 돌아오고,
// 브라우저 뒤로 가기로 장소 카드를 닫는다(.ai/DESIGN.md 지도). 주소를 바꾸면 Next.js가 useSearchParams에 반영한다.
import type { MapFilter } from "@/features/map/model/map-pins";

/**
 * 장소 카드를 열면서 쌓은 기록 칸의 표시. 닫기 버튼은 이 표시가 있으면 뒤로 가기로 그 칸을 지워 기록이 남지 않게 한다.
 * 예전에는 표시를 컴포넌트 ref에 두어, 상세에서 뒤로 오거나 새로 고친 뒤 닫으면 같은 /map 칸이 두 번 남았다(2026-11-16 리뷰).
 * 기록에 둔 값은 Next.js가 뒤로·앞으로 가기 때 그대로 둔다(app-router-state의 preserveCustomHistoryState).
 */
const PLACE_PUSHED_STATE_KEY = "sokchoMoaMapPlacePushed";

/**
 * 지도 보기(가운데와 확대 수준)를 남기는 기록 칸의 값. 상세에 갔다가 돌아오면 지도를 다시 만들 때 이 값으로 연다.
 * 남기지 않았을 때는 돌아올 때마다 처음 보기로 돌아가거나 고른 장소로 확대해, 방문자가 옮겨 둔 지도가 사라졌다(2026-11-22 사용자 결정).
 */
const MAP_VIEW_STATE_KEY = "sokchoMoaMapView";

export interface MapView {
  latitude: number;
  longitude: number;
  zoom: number;
}

/** 지도 주소의 값: 지도 필터(레이어·분야)와 고른 장소 */
type MapQuery = MapFilter & { placeId: string | null };

/** 장소 카드를 연다. 카드가 닫혀 있었으면 기록을 한 칸 쌓아 뒤로 가기로 닫히게 하고, 다른 장소로 바꾸면 그 칸을 고쳐 쓴다. */
export function openMapPlace(query: MapQuery & { placeId: string }, isPlaceOpen: boolean) {
  // 새 칸에도 지금 지도 보기를 옮겨 둔다. 카드를 연 뒤 지도가 움직이지 않으면 새 칸에 보기가 남지 않기 때문이다.
  if (isPlaceOpen) {
    window.history.replaceState(withCurrentMapView(isPlacePushedEntry() ? { [PLACE_PUSHED_STATE_KEY]: true } : {}), "", createMapUrl(query));
  } else {
    window.history.pushState(withCurrentMapView({ [PLACE_PUSHED_STATE_KEY]: true }), "", createMapUrl(query));
  }
}

/** 장소 카드를 닫는다. 연 칸이면 뒤로 가기, 주소로 바로 연 카드면 주소에서 장소만 뺀다. */
export function closeMapPlace(filter: MapFilter) {
  if (isPlacePushedEntry()) window.history.back();
  else replaceMapQuery({ ...filter, placeId: null });
}

/**
 * 기록을 쌓지 않고 주소만 바꾼다(분야 바꾸기, 지도에 없는 장소 빼기). 카드를 연 칸의 표시도 지운다:
 * 분야를 바꾼 뒤 뒤로 가기로 카드를 닫으면 카드를 열기 전 칸(바꾸기 전 분야)으로 돌아가 고른 분야가 사라졌다(2026-11-16 리뷰).
 */
export function replaceMapQuery(query: MapQuery) {
  window.history.replaceState(withCurrentMapView({}), "", createMapUrl(query));
}

/** 지도가 멈출 때마다 이 칸에 지도 보기를 남긴다. 주소 없이 바꾸면 Next.js는 주소·화면을 건드리지 않는다. */
export function saveMapView(view: MapView) {
  const state: unknown = window.history.state;
  window.history.replaceState({ ...(typeof state === "object" && state !== null ? state : {}), [MAP_VIEW_STATE_KEY]: view }, "");
}

/** 이 칸에 남은 지도 보기. 처음 온 칸이면 null이다. */
export function readMapView(): MapView | null {
  const state: unknown = window.history.state;
  if (typeof state !== "object" || state === null || !(MAP_VIEW_STATE_KEY in state)) return null;
  const view: unknown = state[MAP_VIEW_STATE_KEY];
  if (typeof view !== "object" || view === null) return null;
  const { latitude, longitude, zoom } = view as Partial<Record<keyof MapView, unknown>>;
  return typeof latitude === "number" && typeof longitude === "number" && typeof zoom === "number" ? { latitude, longitude, zoom } : null;
}

function withCurrentMapView(state: Record<string, unknown>) {
  const view = readMapView();
  return view === null ? state : { ...state, [MAP_VIEW_STATE_KEY]: view };
}

function isPlacePushedEntry() {
  const state: unknown = window.history.state;
  return typeof state === "object" && state !== null && PLACE_PUSHED_STATE_KEY in state && state[PLACE_PUSHED_STATE_KEY] === true;
}

function createMapUrl({ layer, category, placeId }: MapQuery) {
  const params = new URLSearchParams();
  // 기본 레이어(행사)는 주소에 적지 않는다. 예전 주소(?category=festival)가 그대로 행사 지도로 열린다.
  if (layer !== "events") params.set("layer", layer);
  if (category !== null) params.set("category", category);
  if (placeId !== null) params.set("place", placeId);
  const query = params.toString();
  return query ? `?${query}` : window.location.pathname;
}
