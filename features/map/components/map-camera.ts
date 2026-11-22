// 지도 보기(가운데·확대 수준) 계산. 핀을 다 보이게 맞추기, 장소 카드에 가리지 않게 핀 옮기기(map-view.tsx).
import type { NaverLatLng, NaverMap, NaverMapsApi } from "@/features/map/components/naver-maps";
import { FIT_PINS_PADDING_PX } from "@/features/map/components/map-marker-icon";
import { MAP_DEFAULT_CENTER, type MapPin } from "@/features/map/model/map-pins";
import { MAP_MARKER_BODY_PX } from "@/features/map/model/map-label-layout";

/** 지도를 처음 열 때와 분야를 바꿀 때의 확대 수준. 속초 시내 전체가 보이고, 고성·양양까지 줄여 볼 수 있다. */
export const DEFAULT_ZOOM = 13;
export const MIN_ZOOM = 10;
/** 장소를 고르거나 핀이 하나뿐일 때의 확대 수준(골목이 보이는 정도) */
export const PLACE_ZOOM = 15;
/**
 * 가볼만한 곳 분야에 맞출 때 이보다 멀리 줄이지 않는다. 속초 핀에도 설악산 대청봉·공룡능선 같은 곳이 있어 다 담으면 시내가 작아졌다(2026-11-22).
 * 12면 속초 시내와 설악동이 함께 보인다. 담기지 않은 핀은 지도를 옮겨 본다.
 */
export const PLACE_FIT_MIN_ZOOM = 12;
/** 장소 카드가 지도 아래 시트가 아니라 왼쪽 판으로 열리는 폭(Tailwind md) */
export const SIDE_PANEL_MEDIA_QUERY = "(width >= 48rem)";

/** 지도 상자 안에서 장소 카드에 가리지 않는 영역(px, 지도 상자 기준). 모바일은 아래 시트 위, md 이상은 왼쪽 판 오른쪽이다. */
export interface MapArea {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** 마커가 위치 점 위로 그려지는 높이(몸통 44 + 꼬리 5)와 가장자리 여유. 핀이 이 안쪽에 있어야 마커 전체가 보인다. */
const PIN_VISIBLE_MARGIN_PX = { top: MAP_MARKER_BODY_PX + 24, side: 32, bottom: 24 } as const;

export function getUncoveredMapArea(container: HTMLElement, panel: HTMLElement, isSidePanel: boolean): MapArea {
  const width = container.clientWidth;
  const height = container.clientHeight;
  return isSidePanel
    ? { width, height, left: panel.offsetLeft + panel.offsetWidth, right: width, top: 0, bottom: height }
    : { width, height, left: 0, right: width, top: 0, bottom: height - panel.offsetHeight };
}

/** 지금 화면에서 핀(위치 점)이 가리지 않는 영역 안에 마커 전체가 보이게 있는지 */
export function isPinInArea(map: NaverMap, pin: NaverLatLng, area: MapArea) {
  const projection = map.getProjection();
  const pinOffset = projection.fromCoordToOffset(pin);
  const centerOffset = projection.fromCoordToOffset(map.getCenter());
  const x = area.width / 2 + pinOffset.x - centerOffset.x;
  const y = area.height / 2 + pinOffset.y - centerOffset.y;
  return x >= area.left + PIN_VISIBLE_MARGIN_PX.side
    && x <= area.right - PIN_VISIBLE_MARGIN_PX.side
    && y >= area.top + PIN_VISIBLE_MARGIN_PX.top
    && y <= area.bottom - PIN_VISIBLE_MARGIN_PX.bottom;
}

/**
 * 확대 수준 zoom에서 핀이 가리지 않는 영역의 가운데에 오게 하는 지도 중심. 영역 가운데가 지도 가운데에서 떨어진 만큼(px)
 * 핀에서 반대로 옮긴 곳이 중심이다. 확대 수준이 다르면 같은 거리가 2배씩 달라져(웹 메르카토르) 지금 확대 수준 기준으로 환산한다.
 */
export function getCenterShowingPin(naverMaps: NaverMapsApi, map: NaverMap, pin: NaverLatLng, area: MapArea, zoom: number) {
  const projection = map.getProjection();
  const pinOffset = projection.fromCoordToOffset(pin);
  const scale = 2 ** (map.getZoom() - zoom);
  const shiftX = ((area.left + area.right) / 2 - area.width / 2) * scale;
  const shiftY = ((area.top + area.bottom) / 2 - area.height / 2) * scale;
  return projection.fromOffsetToCoord(new naverMaps.Point(pinOffset.x - shiftX, pinOffset.y - shiftY));
}

/** 지도를 처음 보기(속초 시내 가운데, 확대 13)로 옮긴다. */
export function showDefaultView(naverMaps: NaverMapsApi, map: NaverMap) {
  map.morph(new naverMaps.LatLng(MAP_DEFAULT_CENTER.latitude, MAP_DEFAULT_CENTER.longitude), DEFAULT_ZOOM);
}

/** 핀이 다 보이게 맞춘다. 핀이 없으면 처음 보기, 하나면 그 핀으로 확대한다. 맞춘 뒤 minZoom보다 멀면 minZoom으로 당긴다. */
export function fitPins(naverMaps: NaverMapsApi, map: NaverMap, pins: readonly MapPin[], maxZoom = PLACE_ZOOM, minZoom = MIN_ZOOM) {
  const [first, ...rest] = pins;
  if (first === undefined) {
    showDefaultView(naverMaps, map);
    return;
  }
  if (rest.length === 0) {
    map.morph(new naverMaps.LatLng(first.latitude, first.longitude), maxZoom);
    return;
  }
  const firstLatLng = new naverMaps.LatLng(first.latitude, first.longitude);
  const bounds = new naverMaps.LatLngBounds(firstLatLng, firstLatLng);
  for (const pin of rest) bounds.extend(new naverMaps.LatLng(pin.latitude, pin.longitude));
  map.fitBounds(bounds, { ...FIT_PINS_PADDING_PX, maxZoom });
  if (map.getZoom() < minZoom) map.setZoom(minZoom);
}
