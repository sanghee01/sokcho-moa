import type { Page } from "@playwright/test";

/**
 * 지도 탭 E2E용 가짜 네이버 지도 SDK. 실제 SDK는 등록한 주소·키에서만 뜨고 외부 서비스라, 핀·장소 카드 흐름은 이 가짜로 돌린다.
 * 지도 탭이 쓰는 API(features/map/components/naver-maps.ts)만 흉내 내고, 마커는 지도 상자 오른쪽 위부터 차례로 늘어놓는다.
 * 오른쪽에 두는 이유: 장소 카드가 모바일은 아래, md 이상은 왼쪽을 덮어 핀을 가리지 않게 한다.
 * playwright.config.ts가 가짜 Client ID로 빌드하므로, 이 파일로 막지 않은 요청은 네이버에서 인증 실패가 난다.
 */
const FAKE_NAVER_MAPS_SCRIPT = String.raw`(() => {
  // 마커 상자(몸통 44px, 꼬리까지 높이 49px)와 마커 사이 간격, 지도 안쪽 여백. 아래 flex 배치와 getProjection이 같은 값을 쓴다.
  const MARKER_BOX_PX = 44;
  const MARKER_HEIGHT_PX = 49;
  const MARKER_GAP_PX = 16;
  const MAP_PADDING_PX = 16;
  class LatLng { constructor(lat, lng) { this._lat = lat; this._lng = lng; } lat() { return this._lat; } lng() { return this._lng; } }
  class LatLngBounds { extend() { return this; } }
  class Point { constructor(x, y) { this.x = x; this.y = y; } }
  class Size { constructor(width, height) { this.width = width; this.height = height; } }
  class FakeMap {
    constructor(element, options) {
      this.element = element;
      this.zoom = options.zoom;
      this.center = options.center;
      // test가 확대 수준을 바꾸고 읽을 수 있게 만든 지도를 모아 둔다(상세에서 돌아오면 지도 보기가 그대로인지, list-return.spec.ts).
      (window.__fakeNaverMaps ??= []).push(this);
      this.listeners = [];
      this.markers = [];
      // 실제 SDK처럼 지도 상자 밖으로 넘친 마커는 자른다(overflow: hidden, use-naver-map.ts 주석). 없으면 마커가 모두 이름표를 단 화면에서 페이지가 가로로 넘쳤다.
      Object.assign(element.style, { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", alignContent: "flex-start", gap: MARKER_GAP_PX + "px", padding: MAP_PADDING_PX + "px", overflow: "hidden" });
      // 실제 SDK처럼 마커가 아닌 빈 곳을 누르면 click을 알린다(마커 상자 안을 누른 것은 마커 몫이라 알리지 않는다).
      element.addEventListener("click", (domEvent) => {
        if (domEvent.target instanceof Element && domEvent.target.closest("[data-fake-marker]")) return;
        for (const listener of this.listeners) if (listener.name === "click") listener.handler({ pointerEvent: domEvent });
      });
    }
    // 마커 묶기·장소 이름 배치는 화면 위치로 겹침을 따진다. 가짜 지도는 좌표를 쓰지 않으므로, 위 flex 배치(오른쪽 위부터 줄바꿈)에서
    // 보이는 마커가 놓일 자리를 계산해 돌려준다. 재지 않고 계산하는 이유: 내용이 그려지기 전(폭 0)이나 숨긴 마커(상자 0)를 재면 모두 겹친 것으로 보여
    // 전체 E2E를 병렬로 돌릴 때 핀이 처음부터 하나로 묶여 남았다. 실제 SDK도 그리기 상태와 상관없이 좌표로 위치를 준다.
    // 실제 배치와 다른 자리(예전의 120px 고정 간격)를 알리면 앱이 자리가 넉넉하다고 보고 붙인 이름표가 옆 핀을 덮어 핀을 누를 수 없었다(2026-11-24 CI).
    getProjection() {
      return {
        fromCoordToOffset: (coord) => {
          // 지도에서 뗀 마커와 숨긴 마커(display: none)는 화면 줄에서 빠지므로 세지 않는다.
          const visible = this.markers.filter((item) => item.wrapper.isConnected && !item.wrapper.hidden);
          const index = visible.findIndex((item) => item.position.lat() === coord.lat() && item.position.lng() === coord.lng());
          if (index === -1) return new Point(0, 0);
          const step = MARKER_BOX_PX + MARKER_GAP_PX;
          const perRow = Math.max(1, Math.floor((this.element.clientWidth - MAP_PADDING_PX * 2 + MARKER_GAP_PX) / step));
          const row = Math.floor(index / perRow);
          const countInRow = Math.min(perRow, visible.length - row * perRow);
          const fromRight = countInRow - 1 - (index - row * perRow);
          const x = this.element.clientWidth - MAP_PADDING_PX - MARKER_BOX_PX / 2 - fromRight * step;
          return new Point(x, MAP_PADDING_PX + MARKER_HEIGHT_PX + row * (MARKER_HEIGHT_PX + MARKER_GAP_PX));
        },
        fromOffsetToCoord: () => new LatLng(0, 0),
      };
    }
    getCenter() { return this.center; }
    setCenter(center) { this.center = center; this.emitIdle(); }
    setZoom(zoom) {
      if (zoom === undefined || zoom === this.zoom) return;
      this.zoom = zoom;
      for (const listener of this.listeners) if (listener.name === "zoom_changed") listener.handler(zoom);
      this.emitIdle();
    }
    // 실제 SDK처럼 움직임이 끝나면 idle을 알린다.
    emitIdle() { for (const listener of this.listeners) if (listener.name === "idle") listener.handler(); }
    setOptions() {}
    // 핀 맞추기를 했는지 test가 알 수 있게 센다(실제 SDK는 범위에 맞춰 확대 수준을 바꾸지만 가짜는 마커를 늘어놓기만 해 확대 수준이 그대로다).
    fitBounds() { this.fitBoundsCount = (this.fitBoundsCount ?? 0) + 1; }
    morph(center, zoom) { this.center = center; this.setZoom(zoom); }
    panTo(center) { this.center = center; this.emitIdle(); }
    getZoom() { return this.zoom; }
    autoResize() {}
    destroy() { this.element.replaceChildren(); }
  }
  class Marker {
    constructor(options) {
      this.wrapper = document.createElement("div");
      this.wrapper.dataset.fakeMarker = "";
      this.icon = options.icon;
      this.position = options.position;
      options.map.markers.push(this);
      this.setMap(options.map);
    }
    setMap(map) {
      if (map === null) { this.wrapper.remove(); return; }
      this.wrapper.replaceChildren(this.icon.content);
      map.element.append(this.wrapper);
    }
    setIcon(icon) { this.icon = icon; this.wrapper.replaceChildren(icon.content); }
    setVisible(isVisible) { this.wrapper.hidden = !isVisible; }
    setTitle() {}
    setZIndex() {}
  }
  const Event = {
    addListener(target, name, handler) { const listener = { target, name, handler }; target.listeners.push(listener); return listener; },
    removeListener(listener) { listener.target.listeners = listener.target.listeners.filter((item) => item !== listener); },
  };
  const Position = { TOP_LEFT: 1, TOP_CENTER: 2, TOP_RIGHT: 3, LEFT_CENTER: 4, CENTER: 5, RIGHT_CENTER: 6, BOTTOM_LEFT: 7, BOTTOM_CENTER: 8, BOTTOM_RIGHT: 9, LEFT_TOP: 10, LEFT_BOTTOM: 11, RIGHT_TOP: 12, RIGHT_BOTTOM: 13 };
  window.naver = { maps: { LatLng, LatLngBounds, Point, Size, Map: FakeMap, Marker, Event, Position } };
})();`;

/**
 * 실제 SDK처럼 스크립트를 불러온 뒤 인증 실패를 알린다(등록하지 않은 주소, 잘못된 키).
 * 실제 SDK는 지도와 마커를 만든 뒤에야 인증 응답(401)을 받고, 그때 내부 값을 비워 마커 떼기·이벤트 해제가 TypeError를 던진다.
 * 그래서 마커가 그려질 때까지 기다렸다가 같은 상태로 만든다. 예전 가짜는 지도를 만들기 전에 실패를 알려 이 경우를 놓쳤다(2026-11-21).
 */
const FAKE_AUTH_FAILURE_SCRIPT = `${FAKE_NAVER_MAPS_SCRIPT}
(() => {
  const startedAt = Date.now();
  function failAuth() {
    const brokenSdk = () => { throw new TypeError("Cannot read properties of null (reading 'capitalize')"); };
    window.naver.maps.Marker.prototype.setMap = brokenSdk;
    window.naver.maps.Event.removeListener = brokenSdk;
    window.navermap_authFailure?.();
  }
  (function waitForMarkers() {
    if (document.querySelector("[data-fake-marker]") || Date.now() - startedAt > 3000) failAuth();
    else setTimeout(waitForMarkers, 50);
  })();
})();`;

export async function routeFakeNaverMaps(page: Page, { authFailure = false }: { authFailure?: boolean } = {}) {
  await page.route("**/oapi.map.naver.com/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: authFailure ? FAKE_AUTH_FAILURE_SCRIPT : FAKE_NAVER_MAPS_SCRIPT,
  }));
}
