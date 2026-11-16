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

/** 지도 위를 덮는 판(장소 카드)만큼 비워 두는 안쪽 여백. 이 안쪽을 기준으로 가운데를 맞춘다. */
export interface NaverPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface NaverMap {
  setOptions(key: "padding", value: NaverPadding): void;
  fitBounds(bounds: NaverLatLngBounds, options?: NaverFitBoundsOptions): void;
  morph(center: NaverLatLng, zoom?: number): void;
  panTo(center: NaverLatLng): void;
  getZoom(): number;
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

/** 지도 이벤트. 확대 수준이 바뀔 때 장소 이름을 보일지 정하는 데만 쓴다. addListener가 돌려준 값을 removeListener에 넘긴다. */
export interface NaverMapsEvent {
  addListener(target: NaverMap, eventName: "zoom_changed", listener: (zoom: number) => void): object;
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
