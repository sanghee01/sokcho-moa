// 네이버 지도 JavaScript API v3에서 지도 탭이 쓰는 부분만의 타입. npm 패키지(@types/navermaps)를 들이지 않으려고 직접 적는다(2026-11-16).
// 원본 명세: https://navermaps.github.io/maps.js.ncp/docs/ (Map, Marker, HtmlIcon, MapOptions)

/** 지도 SDK 주소. 개인·일반 통합 콘솔에서 발급한 Client ID는 ncpKeyId로 넘긴다(2025 Maps 상품 전환 뒤 방식). */
export const NAVER_MAPS_SCRIPT_URL = "https://oapi.map.naver.com/openapi/v3/maps.js";

export interface NaverLatLng {
  lat(): number;
  lng(): number;
}

export interface NaverLatLngBounds {
  extend(latLng: NaverLatLng): NaverLatLngBounds;
}

export interface NaverPoint {
  x: number;
  y: number;
}

export interface NaverSize {
  width: number;
  height: number;
}

export interface NaverMapOptions {
  center: NaverLatLng;
  zoom: number;
  minZoom: number;
  maxBounds: NaverLatLngBounds;
  zoomControl: boolean;
  zoomControlOptions: { position: number };
  scaleControl: boolean;
  mapDataControl: boolean;
  logoControlOptions: { position: number };
}

export interface NaverFitBoundsOptions {
  top: number;
  right: number;
  bottom: number;
  left: number;
  maxZoom: number;
}

/** 지도 좌표 ↔ 화면 위치 변환. 마커끼리 화면에서 겹치는지 따질 때 쓴다(숨긴 마커도 위치를 알 수 있다). */
export interface NaverProjection {
  /** 지도 좌표를 화면 위치(px)로 바꾼다. 같은 확대 수준에서 두 위치의 차이만 쓴다. */
  fromCoordToOffset(coord: NaverLatLng): NaverPoint;
  /** 화면 위치(px)를 지도 좌표로 바꾼다. */
  fromOffsetToCoord(offset: NaverPoint): NaverLatLng;
}

export interface NaverMap {
  getProjection(): NaverProjection;
  getCenter(): NaverLatLng;
  /** 애니메이션 없이 중심을 옮긴다(동작 줄이기 설정일 때). */
  setCenter(center: NaverLatLng): void;
  fitBounds(bounds: NaverLatLngBounds, options?: NaverFitBoundsOptions): void;
  morph(center: NaverLatLng, zoom?: number): void;
  panTo(center: NaverLatLng): void;
  getZoom(): number;
  setZoom(zoom: number, effect?: boolean): void;
  autoResize(): void;
  destroy(): void;
}

export interface NaverHtmlIcon {
  content: HTMLElement;
  size: NaverSize;
  anchor: NaverPoint;
}

export interface NaverMarkerOptions {
  map: NaverMap;
  position: NaverLatLng;
  icon: NaverHtmlIcon;
  title: string;
  zIndex: number;
}

export interface NaverMarker {
  setMap(map: NaverMap | null): void;
  setIcon(icon: NaverHtmlIcon): void;
  setZIndex(zIndex: number): void;
  /** 지도에서 떼지 않고 숨기거나 다시 보인다. 분야를 바꿀 때 마커를 다시 만들지 않으려고 쓴다. */
  setVisible(isVisible: boolean): void;
  setTitle(title: string): void;
}

/** 지도를 누른 이벤트. 원래 브라우저 이벤트로 마커를 누른 것인지 가린다(문서는 pointerEvent, 버전에 따라 domEvent). */
export interface NaverPointerEvent {
  pointerEvent?: Event;
  domEvent?: Event;
}

/**
 * 지도 이벤트. 움직임이 끝날 때(idle) 마커 배치를 다시 계산하고, 빈 곳을 누르면(click) 고른 장소를 푼다.
 * addListener가 돌려준 값을 removeListener에 넘긴다.
 */
export interface NaverMapsEvent {
  addListener(target: NaverMap, eventName: "idle", listener: () => void): object;
  addListener(target: NaverMap, eventName: "click", listener: (event: NaverPointerEvent) => void): object;
  removeListener(listener: object): void;
}

export interface NaverMapsApi {
  Event: NaverMapsEvent;
  Map: new (element: HTMLElement, options: NaverMapOptions) => NaverMap;
  LatLng: new (latitude: number, longitude: number) => NaverLatLng;
  LatLngBounds: new (southWest: NaverLatLng, northEast: NaverLatLng) => NaverLatLngBounds;
  Point: new (x: number, y: number) => NaverPoint;
  Size: new (width: number, height: number) => NaverSize;
  Marker: new (options: NaverMarkerOptions) => NaverMarker;
  Position: { TOP_RIGHT: number; RIGHT_TOP: number };
}

declare global {
  interface Window {
    naver?: { maps?: NaverMapsApi };
    /** Client ID 인증에 실패하면(등록하지 않은 주소, 잘못된 키) 지도 SDK가 부르는 함수 */
    navermap_authFailure?: () => void;
  }
}

/** 지도 SDK를 다 불러왔으면 그 API, 아니면 null */
export function getNaverMaps() {
  return window.naver?.maps ?? null;
}

// 인증 실패는 SDK가 스크립트를 처음 불러올 때 한 번만 알린다. 다른 페이지에 다녀오면 스크립트를 다시 받지 않아 알림도 다시 오지 않아서,
// 기억해 두지 않으면 두 번째 방문에는 안내 없이 깨진 지도가 보였다(2026-11-16 리뷰).
let hasAuthFailed = false;

/** 이 탭에서 지도 SDK 인증이 이미 실패했는지 */
export function hasNaverMapsAuthFailed() {
  return hasAuthFailed;
}

/**
 * 지도 SDK 호출(마커 만들기·떼기, 이벤트 해제, 지도 지우기)이 실패해도 페이지 전체가 오류 화면이 되지 않게 감싼다. 성공했으면 true.
 * 실제 SDK는 지도와 마커를 만든 뒤 인증에 실패하면(401) 내부 값을 비워, 이 호출들이 TypeError를 던진다. effect 안의 오류는 페이지 전체를
 * "페이지를 불러오지 못했습니다"로 바꿔 "지금은 지도를 볼 수 없어요" 안내와 GA map_unavailable이 묻혔다(2026-11-21, 등록하지 않은 포트에서 확인).
 * 인증 실패가 아닌데 실패하면 원인을 찾을 수 있게 콘솔에 남긴다.
 */
export function callNaverMapsSafely(call: () => void) {
  try {
    call();
    return true;
  } catch (error) {
    if (!hasAuthFailed) console.error(error);
    return false;
  }
}

/** 인증 실패를 받을 함수를 건다. 돌려준 함수로 풀어도 실패 기록은 남겨, 화면을 떠난 사이에 온 실패도 다음 방문에 안다. */
export function listenNaverMapsAuthFailure(onFailure: () => void) {
  window.navermap_authFailure = () => {
    hasAuthFailed = true;
    onFailure();
  };
  return () => {
    window.navermap_authFailure = () => {
      hasAuthFailed = true;
    };
  };
}
