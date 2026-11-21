import type { Page } from "@playwright/test";

/**
 * 지도 탭 E2E용 가짜 네이버 지도 SDK. 실제 SDK는 등록한 주소·키에서만 뜨고 외부 서비스라, 핀·장소 카드 흐름은 이 가짜로 돌린다.
 * 지도 탭이 쓰는 API(features/events/components/map/naver-maps.ts)만 흉내 내고, 마커는 지도 상자 오른쪽 위부터 차례로 늘어놓는다.
 * 오른쪽에 두는 이유: 장소 카드가 모바일은 아래, md 이상은 왼쪽을 덮어 핀을 가리지 않게 한다.
 * playwright.config.ts가 가짜 Client ID로 빌드하므로, 이 파일로 막지 않은 요청은 네이버에서 인증 실패가 난다.
 */
const FAKE_NAVER_MAPS_SCRIPT = String.raw`(() => {
  class LatLng { constructor(lat, lng) { this._lat = lat; this._lng = lng; } lat() { return this._lat; } lng() { return this._lng; } }
  class LatLngBounds { extend() { return this; } }
  class Point { constructor(x, y) { this.x = x; this.y = y; } }
  class Size { constructor(width, height) { this.width = width; this.height = height; } }
  class FakeMap {
    constructor(element, options) {
      this.element = element;
      this.zoom = options.zoom;
      this.listeners = [];
      this.markers = [];
      Object.assign(element.style, { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", alignContent: "flex-start", gap: "16px", padding: "16px" });
      // 실제 SDK처럼 마커가 아닌 빈 곳을 누르면 click을 알린다(마커 상자 안을 누른 것은 마커 몫이라 알리지 않는다).
      element.addEventListener("click", (domEvent) => {
        if (domEvent.target instanceof Element && domEvent.target.closest("[data-fake-marker]")) return;
        for (const listener of this.listeners) if (listener.name === "click") listener.handler({ pointerEvent: domEvent });
      });
    }
    // 마커 묶기·장소 이름 배치는 화면 위치로 겹침을 따진다. 가짜 지도는 좌표 대신 마커를 늘어놓으므로, 그 마커가 놓인 자리(상자 아래 가운데)를 돌려준다.
    getProjection() {
      return {
        fromCoordToOffset: (coord) => {
          const marker = this.markers.find((item) => item.position.lat() === coord.lat() && item.position.lng() === coord.lng());
          const box = marker?.wrapper.getBoundingClientRect();
          return box ? new Point(box.left + box.width / 2, box.bottom) : new Point(0, 0);
        },
        fromOffsetToCoord: () => new LatLng(0, 0),
      };
    }
    getCenter() { return new LatLng(0, 0); }
    setCenter() {}
    setZoom(zoom) {
      if (zoom === undefined || zoom === this.zoom) return;
      this.zoom = zoom;
      for (const listener of this.listeners) if (listener.name === "zoom_changed") listener.handler(zoom);
    }
    setOptions() {}
    fitBounds() {}
    morph(center, zoom) { this.setZoom(zoom); }
    panTo() {}
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

/** 실제 SDK처럼 스크립트를 불러온 뒤 인증 실패를 알린다(등록하지 않은 주소, 잘못된 키). */
const FAKE_AUTH_FAILURE_SCRIPT = `${FAKE_NAVER_MAPS_SCRIPT}\nsetTimeout(() => window.navermap_authFailure?.(), 0);`;

export async function routeFakeNaverMaps(page: Page, { authFailure = false }: { authFailure?: boolean } = {}) {
  await page.route("**/oapi.map.naver.com/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: authFailure ? FAKE_AUTH_FAILURE_SCRIPT : FAKE_NAVER_MAPS_SCRIPT,
  }));
}
