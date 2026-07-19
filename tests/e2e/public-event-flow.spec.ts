import { expect, test, type Locator, type Page } from "@playwright/test";

type ElementBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NaverHarnessState = {
  mapCount: number;
  destroyCount: number;
  markerDetachCount: number;
  pendingTilesloaded: number;
  tilesloadedListenerRemoveCount: number;
  sdkPreDestroyCount: number;
  cleanupThrowCount: number;
  markerCount: number;
  markerTitle: string | null;
  markerLatitude: number | null;
  markerLongitude: number | null;
  zoom: { present: boolean; value: unknown } | null;
  interactionOptions: {
    draggable: { present: boolean; value: unknown };
    pinchZoom: { present: boolean; value: unknown };
    scrollWheel: { present: boolean; value: unknown };
    keyboardShortcuts: { present: boolean; value: unknown };
    disableDoubleClickZoom: { present: boolean; value: unknown };
    disableDoubleTapZoom: { present: boolean; value: unknown };
    disableTwoFingerTapZoom: { present: boolean; value: unknown };
  } | null;
};

type NaverHarnessWindow = {
  __naverE2E?: {
    state: NaverHarnessState;
    releaseTiles: () => void;
    failAuthAfterSdkCleanup: () => void;
    failAuthAfterUnmount: () => void;
  };
};

const PLAYWRIGHT_NAVER_DUMMY_CLIENT_ID = "playwright-public-dummy-client-id";
const NAVER_SDK_ROUTE = /^https:\/\/oapi\.map\.naver\.com\/openapi\/v3\/maps\.js\?/;
const TEST_NAVER_SDK = `
(() => {
  const state = {
    mapCount: 0,
    destroyCount: 0,
    markerDetachCount: 0,
    pendingTilesloaded: 0,
    tilesloadedListenerRemoveCount: 0,
    sdkPreDestroyCount: 0,
    cleanupThrowCount: 0,
    markerCount: 0,
    markerTitle: null,
    markerLatitude: null,
    markerLongitude: null,
    zoom: null,
    interactionOptions: null,
  };
  const tilesloadedListeners = [];
  const mapInstances = [];
  const markerInstances = [];

  class TestLatLng {
    constructor(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
  }

  class TestMap {
    constructor(container, options) {
      this.container = container;
      this.sdkDestroyed = false;
      mapInstances.push(this);
      state.mapCount += 1;
      const recordOption = (name) => Object.prototype.hasOwnProperty.call(options, name)
        ? { present: true, value: options[name] }
        : { present: false, value: "__missing__" };
      state.zoom = recordOption("zoom");
      state.interactionOptions = {
        draggable: recordOption("draggable"),
        pinchZoom: recordOption("pinchZoom"),
        scrollWheel: recordOption("scrollWheel"),
        keyboardShortcuts: recordOption("keyboardShortcuts"),
        disableDoubleClickZoom: recordOption("disableDoubleClickZoom"),
        disableDoubleTapZoom: recordOption("disableDoubleTapZoom"),
        disableTwoFingerTapZoom: recordOption("disableTwoFingerTapZoom"),
      };
      container.parentElement.dataset.naverTestMap = "created";
      const attributionLink = document.createElement("a");
      attributionLink.href = "https://www.naver.com/";
      attributionLink.textContent = "NAVER 지도 정보";
      container.append(attributionLink);
    }

    destroy() {
      state.destroyCount += 1;
      if (this.sdkDestroyed) {
        state.cleanupThrowCount += 1;
        throw new TypeError("SDK가 이미 지도를 파괴했습니다.");
      }
    }

    sdkDestroy() {
      this.sdkDestroyed = true;
      state.sdkPreDestroyCount += 1;
    }
  }

  class TestMarker {
    constructor(options) {
      this.sdkDestroyed = false;
      markerInstances.push(this);
      state.markerCount += 1;
      state.markerTitle = options.title;
      state.markerLatitude = options.position.latitude;
      state.markerLongitude = options.position.longitude;

      const marker = document.createElement("span");
      marker.dataset.naverTestMarker = "";
      options.map.container.append(marker);
    }

    setMap(map) {
      if (map !== null) return;
      state.markerDetachCount += 1;
      if (this.sdkDestroyed) {
        state.cleanupThrowCount += 1;
        throw new TypeError("SDK가 이미 마커를 파괴했습니다.");
      }
    }

    sdkDestroy() {
      this.sdkDestroyed = true;
      state.sdkPreDestroyCount += 1;
    }
  }

  window.__naverE2E = {
    state,
    releaseTiles: () => {
      for (const eventListener of tilesloadedListeners) {
        if (!eventListener.active) continue;
        eventListener.active = false;
        eventListener.target.container.parentElement.dataset.naverTestMap = "ready";
        eventListener.listener();
      }
      state.pendingTilesloaded = tilesloadedListeners.filter((item) => item.active).length;
    },
    failAuthAfterSdkCleanup: () => {
      const authFailure = window.navermap_authFailure;
      for (const marker of markerInstances) marker.sdkDestroy();
      for (const map of mapInstances) map.sdkDestroy();
      if (window.naver) delete window.naver.maps;
      authFailure?.();
    },
    failAuthAfterUnmount: () => {
      const authFailure = window.navermap_authFailure;
      if (window.naver) delete window.naver.maps;
      authFailure?.();
    },
  };
  window.naver = {
    maps: {
      LatLng: TestLatLng,
      Map: TestMap,
      Marker: TestMarker,
      Event: {
        once: (target, eventName, listener) => {
          if (eventName !== "tilesloaded") throw new Error("unexpected event: " + eventName);
          const eventListener = { target, listener, active: true };
          tilesloadedListeners.push(eventListener);
          state.pendingTilesloaded = tilesloadedListeners.filter((item) => item.active).length;
          if (window.__naverAutoReleaseTiles) {
            queueMicrotask(() => window.__naverE2E?.releaseTiles());
          }
          return eventListener;
        },
        removeListener: (eventListener) => {
          if (!eventListener.active) return;
          eventListener.active = false;
          state.tilesloadedListenerRemoveCount += 1;
          state.pendingTilesloaded = tilesloadedListeners.filter((item) => item.active).length;
        },
      },
    },
  };
})();
`;

async function visibleBox(locator: Locator): Promise<ElementBox> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function expectSameDimensions(actual: ElementBox, expected: ElementBox) {
  expect(Math.abs(actual.width - expected.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.height - expected.height)).toBeLessThanOrEqual(1);
}

async function expectNoHorizontalOverflow(page: Page, locators: Locator[]) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1);

  for (const locator of locators) {
    const box = await visibleBox(locator);
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(widths.viewport + 1);
  }
}

function expectNaverSdkRequest(url: string) {
  const sdkUrl = new URL(url);
  expect(sdkUrl.origin).toBe("https://oapi.map.naver.com");
  expect(sdkUrl.pathname).toBe("/openapi/v3/maps.js");
  expect(sdkUrl.searchParams.get("ncpKeyId")).toBe(PLAYWRIGHT_NAVER_DUMMY_CLIENT_ID);
  expect(sdkUrl.searchParams.has("ncpClientId")).toBe(false);
}

async function installControllableNaverSdk(page: Page) {
  let sdkRequestCount = 0;
  let releaseSdkRequest = () => {};
  const sdkDecision = new Promise<void>((resolve) => {
    releaseSdkRequest = resolve;
  });
  let markSdkIntercepted = () => {};
  const sdkIntercepted = new Promise<void>((resolve) => {
    markSdkIntercepted = resolve;
  });

  await page.route(NAVER_SDK_ROUTE, async (route) => {
    expectNaverSdkRequest(route.request().url());
    sdkRequestCount += 1;
    markSdkIntercepted();
    await sdkDecision;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: TEST_NAVER_SDK,
      headers: { "cache-control": "no-store" },
    });
  });

  return {
    sdkIntercepted,
    releaseSdkRequest,
    getSdkRequestCount: () => sdkRequestCount,
  };
}

async function getNaverHarnessState(page: Page) {
  return page.evaluate(() => (window as unknown as NaverHarnessWindow).__naverE2E?.state ?? null);
}

async function releaseNaverTiles(page: Page) {
  await page.evaluate(() => (window as unknown as NaverHarnessWindow).__naverE2E?.releaseTiles());
}

async function failNaverAuthAfterSdkCleanup(page: Page) {
  await page.evaluate(() => (window as unknown as NaverHarnessWindow).__naverE2E?.failAuthAfterSdkCleanup());
}

async function enableNaverAutoTileRelease(page: Page) {
  await page.addInitScript(() => {
    (window as typeof window & { __naverAutoReleaseTiles?: boolean }).__naverAutoReleaseTiles = true;
  });
  await page.evaluate(() => {
    (window as typeof window & { __naverAutoReleaseTiles?: boolean }).__naverAutoReleaseTiles = true;
  });
}

async function failNaverAuthAfterUnmount(page: Page) {
  await page.evaluate(() => (window as unknown as NaverHarnessWindow).__naverE2E?.failAuthAfterUnmount());
}

test("네이버 지도 컨테이너는 로딩부터 단일 마커 준비까지 높이·SDK 옵션·페이지 스크롤을 지킨다", async ({ page }) => {
  const sdk = await installControllableNaverSdk(page);
  await page.goto("/events/demo-sea-family-festival", { waitUntil: "domcontentloaded" });
  await sdk.sdkIntercepted;

  const map = page.getByRole("img", { name: /속초해수욕장 인근\(샘플\) 위치 지도/ });
  const loadingStatus = page.getByRole("status").filter({ hasText: "지도를 불러오는 중입니다." });
  await expect(loadingStatus).toBeVisible();
  const loadingBox = await visibleBox(map);
  expect(loadingBox.height).toBe(288);

  sdk.releaseSdkRequest();
  await expect.poll(async () => (await getNaverHarnessState(page))?.pendingTilesloaded ?? 0).toBe(1);
  await releaseNaverTiles(page);
  await expect(loadingStatus).toBeHidden();
  await expect(map).toHaveAttribute("data-naver-test-map", "ready");
  await expect(page.locator("[data-naver-test-marker]")).toHaveCount(1);
  expect(await page.evaluate(() => typeof window.navermap_authFailure)).toBe("function");

  const readyBox = await visibleBox(map);
  expectSameDimensions(readyBox, loadingBox);

  const state = await getNaverHarnessState(page);
  expect(state).not.toBeNull();
  expect(state).toEqual({
    mapCount: 1,
    destroyCount: 0,
    markerDetachCount: 0,
    pendingTilesloaded: 0,
    tilesloadedListenerRemoveCount: 0,
    sdkPreDestroyCount: 0,
    cleanupThrowCount: 0,
    markerCount: 1,
    markerTitle: "속초해수욕장 인근(샘플)",
    markerLatitude: 38.1907,
    markerLongitude: 128.6015,
    zoom: { present: true, value: 16 },
    interactionOptions: {
      draggable: { present: true, value: false },
      pinchZoom: { present: true, value: false },
      scrollWheel: { present: true, value: false },
      keyboardShortcuts: { present: true, value: false },
      disableDoubleClickZoom: { present: true, value: true },
      disableDoubleTapZoom: { present: true, value: true },
      disableTwoFingerTapZoom: { present: true, value: true },
    },
  });

  await expect(map).not.toHaveAttribute("tabindex");
  expect(await map.evaluate((element) => (element as HTMLElement).tabIndex)).toBe(-1);
  expect(await map.evaluate((element) => {
    (element as HTMLElement).focus();
    return document.activeElement === element;
  })).toBe(false);
  const sdkFocusableLink = map.getByRole("link", { includeHidden: true });
  await expect(sdkFocusableLink).toHaveCount(1);
  expect(await sdkFocusableLink.evaluate((element) => {
    (element as HTMLElement).focus();
    return document.activeElement === element;
  })).toBe(false);

  await map.evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    const mapTop = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, mapTop - window.innerHeight / 3));
  });
  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  await page.mouse.move(mapBox!.x + mapBox!.width / 2, mapBox!.y + mapBox!.height / 2);
  const scrollBeforeWheel = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 240);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBeforeWheel);

  await page.getByRole("link", { name: "행사 목록", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(await page.evaluate(() => typeof window.navermap_authFailure)).toBe("undefined");
  expect((await getNaverHarnessState(page))?.destroyCount).toBe(1);
  expect((await getNaverHarnessState(page))?.markerDetachCount).toBe(1);
});

test("네이버 지도 SDK 실패 전후에도 지도 대체 영역 높이가 유지된다", async ({ page }) => {
  let releaseSdkRequest = () => {};
  const sdkDecision = new Promise<void>((resolve) => {
    releaseSdkRequest = resolve;
  });
  let markSdkIntercepted = () => {};
  const sdkIntercepted = new Promise<void>((resolve) => {
    markSdkIntercepted = resolve;
  });

  await page.route(NAVER_SDK_ROUTE, async (route) => {
    expectNaverSdkRequest(route.request().url());
    markSdkIntercepted();
    await sdkDecision;
    await route.abort("failed");
  });

  await page.goto("/events/demo-sea-family-festival", { waitUntil: "domcontentloaded" });
  await sdkIntercepted;

  const map = page.getByRole("img", { name: /속초해수욕장 인근\(샘플\) 위치 지도/ });
  const loadingStatus = page.getByRole("status").filter({ hasText: "지도를 불러오는 중입니다." });
  await expect(loadingStatus).toBeVisible();
  const loadingBox = await visibleBox(map);

  releaseSdkRequest();
  const failureStatus = page.getByRole("status").filter({ hasText: "지도를 불러오지 못했습니다." });
  await expect(failureStatus).toBeVisible();
  const failedBox = await visibleBox(failureStatus);

  expectSameDimensions(failedBox, loadingBox);
  expect(failedBox.height).toBe(288);
  expect(await page.evaluate(() => typeof window.navermap_authFailure)).toBe("function");
  await expect(page.locator('[role="img"][aria-label*="속초해수욕장 인근(샘플) 위치 지도"]'))
    .toHaveAttribute("aria-hidden", "true");
});

test("준비된 네이버 지도에서 비동기 인증 오류가 나면 지도를 파괴하고 이탈 시 기존 콜백을 복원한다", async ({ page }) => {
  await page.addInitScript(() => {
    const testWindow = window as typeof window & {
      __originalNaverAuthFailure?: () => void;
      __originalNaverAuthFailureCalls?: number;
    };
    testWindow.__originalNaverAuthFailureCalls = 0;
    testWindow.__originalNaverAuthFailure = () => {
      testWindow.__originalNaverAuthFailureCalls! += 1;
    };
    window.navermap_authFailure = testWindow.__originalNaverAuthFailure;
  });

  const sdk = await installControllableNaverSdk(page);
  await page.goto("/events/demo-sea-family-festival", { waitUntil: "domcontentloaded" });
  await sdk.sdkIntercepted;

  const map = page.getByRole("img", { name: /속초해수욕장 인근\(샘플\) 위치 지도/ });
  const loadingStatus = page.getByRole("status").filter({ hasText: "지도를 불러오는 중입니다." });
  await expect(loadingStatus).toBeVisible();
  const loadingBox = await visibleBox(map);

  sdk.releaseSdkRequest();
  await expect.poll(async () => (await getNaverHarnessState(page))?.pendingTilesloaded ?? 0).toBe(1);
  await releaseNaverTiles(page);
  await expect(map).toHaveAttribute("data-naver-test-map", "ready");
  expect(sdk.getSdkRequestCount()).toBe(1);
  expect(await page.evaluate(() => {
    const testWindow = window as typeof window & { __originalNaverAuthFailure?: () => void };
    return window.navermap_authFailure !== testWindow.__originalNaverAuthFailure;
  })).toBe(true);

  await failNaverAuthAfterSdkCleanup(page);
  const failureStatus = page.getByRole("status").filter({ hasText: "지도를 불러오지 못했습니다." });
  await expect(failureStatus).toBeVisible();
  expectSameDimensions(await visibleBox(failureStatus), loadingBox);
  expect((await visibleBox(failureStatus)).height).toBe(288);

  const authStateWhileMounted = await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __originalNaverAuthFailure?: () => void;
      __originalNaverAuthFailureCalls?: number;
    };
    return {
      originalCalls: testWindow.__originalNaverAuthFailureCalls,
      bridgeStillMounted: window.navermap_authFailure !== testWindow.__originalNaverAuthFailure,
    };
  });
  expect(authStateWhileMounted).toEqual({ originalCalls: 1, bridgeStillMounted: true });
  expect((await getNaverHarnessState(page))?.destroyCount).toBe(1);
  expect((await getNaverHarnessState(page))?.markerDetachCount).toBe(1);
  expect((await getNaverHarnessState(page))?.sdkPreDestroyCount).toBe(2);
  expect((await getNaverHarnessState(page))?.cleanupThrowCount).toBe(2);

  await page.getByRole("link", { name: "행사 목록", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(await page.evaluate(() => {
    const testWindow = window as typeof window & { __originalNaverAuthFailure?: () => void };
    return window.navermap_authFailure === testWindow.__originalNaverAuthFailure;
  })).toBe(true);

  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect.poll(async () => (await getNaverHarnessState(page))?.pendingTilesloaded ?? 0).toBe(1);
  await releaseNaverTiles(page);
  await expect(map).toHaveAttribute("data-naver-test-map", "ready");
  expect(sdk.getSdkRequestCount()).toBe(2);
  await expect(page.locator("[data-naver-test-marker]")).toHaveCount(1);
  expect(await page.evaluate(() => {
    const testWindow = window as typeof window & { __originalNaverAuthFailure?: () => void };
    return window.navermap_authFailure !== testWindow.__originalNaverAuthFailure;
  })).toBe(true);

  await page.getByRole("link", { name: "행사 목록", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(await page.evaluate(() => {
    const testWindow = window as typeof window & { __originalNaverAuthFailure?: () => void };
    return window.navermap_authFailure === testWindow.__originalNaverAuthFailure;
  })).toBe(true);
  expect((await getNaverHarnessState(page))?.destroyCount).toBe(1);
  expect((await getNaverHarnessState(page))?.markerDetachCount).toBe(1);
});

test("지도 이탈 뒤 늦은 인증 실패로 SDK namespace가 사라지면 재진입에서 새 SDK를 요청한다", async ({ page }) => {
  await page.addInitScript(() => {
    const testWindow = window as typeof window & {
      __originalNaverAuthFailure?: () => void;
      __originalNaverAuthFailureCalls?: number;
    };
    testWindow.__originalNaverAuthFailureCalls = 0;
    testWindow.__originalNaverAuthFailure = () => {
      testWindow.__originalNaverAuthFailureCalls! += 1;
    };
    window.navermap_authFailure = testWindow.__originalNaverAuthFailure;
  });

  const sdk = await installControllableNaverSdk(page);
  await page.goto("/events/demo-sea-family-festival", { waitUntil: "domcontentloaded" });
  await sdk.sdkIntercepted;
  sdk.releaseSdkRequest();
  await expect.poll(async () => (await getNaverHarnessState(page))?.pendingTilesloaded ?? 0).toBe(1);
  expect(sdk.getSdkRequestCount()).toBe(1);

  await page.getByRole("link", { name: "행사 목록", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(await page.evaluate(() => {
    const testWindow = window as typeof window & { __originalNaverAuthFailure?: () => void };
    return window.navermap_authFailure === testWindow.__originalNaverAuthFailure;
  })).toBe(true);

  await failNaverAuthAfterUnmount(page);
  expect(await page.evaluate(() => {
    const testWindow = window as typeof window & { __originalNaverAuthFailureCalls?: number };
    return {
      originalCalls: testWindow.__originalNaverAuthFailureCalls,
      mapsMissing: !window.naver?.maps,
    };
  })).toEqual({ originalCalls: 1, mapsMissing: true });

  await enableNaverAutoTileRelease(page);
  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  const map = page.getByRole("img", { name: /속초해수욕장 인근\(샘플\) 위치 지도/ });
  await expect(map).toHaveAttribute("data-naver-test-map", "ready");
  expect(sdk.getSdkRequestCount()).toBe(2);
  await expect(page.locator("[data-naver-test-marker]")).toHaveCount(1);
});

test("네이버 SDK 로딩 시간 초과 뒤 상세 화면에 다시 들어오면 새 요청으로 복구한다", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) =>
      Reflect.apply(nativeSetTimeout, window, [handler, delay === 8_000 ? 500 : delay, ...args])) as typeof window.setTimeout;
  });

  let sdkRequestCount = 0;
  let releaseFirstSdkRequest = () => {};
  const firstSdkRequestGate = new Promise<void>((resolve) => {
    releaseFirstSdkRequest = resolve;
  });
  let markFirstSdkRequestFinished = () => {};
  const firstSdkRequestFinished = new Promise<void>((resolve) => {
    markFirstSdkRequestFinished = resolve;
  });
  await page.route(NAVER_SDK_ROUTE, async (route) => {
    expectNaverSdkRequest(route.request().url());
    sdkRequestCount += 1;
    if (sdkRequestCount === 1) {
      await firstSdkRequestGate;
      await route.abort("timedout").catch(() => {});
      markFirstSdkRequestFinished();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: TEST_NAVER_SDK,
      headers: { "cache-control": "no-store" },
    });
  });

  await page.goto("/events/demo-sea-family-festival", { waitUntil: "domcontentloaded" });
  const failureStatus = page.getByRole("status").filter({ hasText: "지도를 불러오지 못했습니다." });
  await expect(failureStatus).toBeVisible();
  await expect(page.locator("script[data-sokcho-moa-naver-maps-sdk]")).toHaveCount(0);
  releaseFirstSdkRequest();
  await firstSdkRequestFinished;

  await page.getByRole("link", { name: "행사 목록", exact: true }).click();
  await enableNaverAutoTileRelease(page);
  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();

  const map = page.getByRole("img", { name: /속초해수욕장 인근\(샘플\) 위치 지도/ });
  await expect(map).toHaveAttribute("data-naver-test-map", "ready");
  expect(sdkRequestCount).toBe(2);
  await expect(page.locator("[data-naver-test-marker]")).toHaveCount(1);
});

test("네이버 SDK 이후 타일 준비가 멈추면 지도를 정리하고 재진입에서 복구한다", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) =>
      Reflect.apply(nativeSetTimeout, window, [handler, delay === 8_000 ? 3_000 : delay, ...args])) as typeof window.setTimeout;
  });

  const sdk = await installControllableNaverSdk(page);
  await page.goto("/events/demo-sea-family-festival", { waitUntil: "domcontentloaded" });
  await sdk.sdkIntercepted;
  sdk.releaseSdkRequest();

  await expect.poll(async () => (await getNaverHarnessState(page))?.pendingTilesloaded ?? 0).toBe(1);
  const map = page.getByRole("img", { name: /속초해수욕장 인근\(샘플\) 위치 지도/ });
  const loadingBox = await visibleBox(map);
  const failureStatus = page.getByRole("status").filter({ hasText: "지도를 불러오지 못했습니다." });
  await expect(failureStatus).toBeVisible();
  expectSameDimensions(await visibleBox(failureStatus), loadingBox);
  expect((await getNaverHarnessState(page))?.tilesloadedListenerRemoveCount).toBe(1);
  expect((await getNaverHarnessState(page))?.markerDetachCount).toBe(1);
  expect((await getNaverHarnessState(page))?.destroyCount).toBe(1);

  await page.getByRole("link", { name: "행사 목록", exact: true }).click();
  await enableNaverAutoTileRelease(page);
  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(map).toHaveAttribute("data-naver-test-map", "ready");
  expect((await getNaverHarnessState(page))?.mapCount).toBe(2);
  expect((await getNaverHarnessState(page))?.markerCount).toBe(2);
});

test("정상·null·빈 문자열·404 이미지가 목록과 상세에서 같은 크기를 유지한다", async ({ page }) => {
  let imageResponse: "normal" | "missing" = "normal";
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );

  await page.route("https://oapi.map.naver.com/**", (route) => route.abort("blockedbyclient"));
  await page.route("**/missing-event-image.jpg", async (route) => {
    if (imageResponse === "normal") {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: pixel,
        headers: { "cache-control": "no-store" },
      });
      return;
    }
    await route.fulfill({ status: 404, body: "", headers: { "cache-control": "no-store" } });
  });

  await page.goto("/");
  const youthCard = page.getByRole("article").filter({ hasText: "청소년 미디어 창작 교실" });
  const normalListImage = youthCard.getByRole("img", { name: "[샘플] 청소년 미디어 창작 교실" });
  await expect.poll(() => normalListImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
  const normalListBox = await visibleBox(normalListImage);
  expect(normalListBox.width / normalListBox.height).toBeCloseTo(16 / 9, 1);

  await page.goto("/events/demo-youth-media-class");
  const normalDetailImage = page.getByRole("img", { name: "[샘플] 청소년 미디어 창작 교실" });
  await expect.poll(() => normalDetailImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
  const normalDetailBox = await visibleBox(normalDetailImage);

  imageResponse = "missing";
  await page.goto("/");

  const fallbackTitles = [
    "[샘플] 바다빛 가족 문화축제",
    "[샘플] 어린이 바다 공예 체험",
    "[샘플] 청소년 미디어 창작 교실",
  ];
  const fallbackListBoxes: ElementBox[] = [];
  for (const title of fallbackTitles) {
    const card = page.getByRole("article").filter({ hasText: title });
    const imageFallback = card.getByRole("img", { name: `${title} 대표 이미지` });
    await expect(imageFallback).toBeVisible();
    await expect(imageFallback).toBeEmpty();
    fallbackListBoxes.push(await visibleBox(imageFallback));
  }

  for (const fallbackBox of fallbackListBoxes) {
    expectSameDimensions(fallbackBox, normalListBox);
    expect(fallbackBox.width / fallbackBox.height).toBeCloseTo(16 / 9, 1);
  }
  await expect(page.getByText("공식 이미지 준비 중")).toHaveCount(0);

  const detailFixtures = [
    ["demo-sea-family-festival", fallbackTitles[0]],
    ["demo-children-craft", fallbackTitles[1]],
    ["demo-youth-media-class", fallbackTitles[2]],
  ] as const;

  for (const [slug, title] of detailFixtures) {
    await page.goto(`/events/${slug}`);
    const imageFallback = page.getByRole("img", { name: `${title} 대표 이미지` }).first();
    await expect(imageFallback).toBeVisible();
    await expect(imageFallback).toBeEmpty();
    expectSameDimensions(await visibleBox(imageFallback), normalDetailBox);
    await expect(page.getByText("공식 이미지 준비 중")).toHaveCount(0);
  }
});

test("목록과 상세는 데스크톱·모바일에서 가로로 넘치지 않는다", async ({ page }) => {
  const sdk = await installControllableNaverSdk(page);
  await page.goto("/");
  const listHeading = page.getByRole("heading", { name: "요즘 속초에서 뭐 하지?" });
  await expect(listHeading).toBeVisible();

  await expectNoHorizontalOverflow(page, [
    page.getByRole("main").filter({ has: listHeading }),
    page.getByRole("region", { name: "어떤 하루를 찾으세요?" }),
    page.getByRole("article").first(),
  ]);

  await page.goto("/events/demo-sea-family-festival", { waitUntil: "domcontentloaded" });
  await sdk.sdkIntercepted;
  sdk.releaseSdkRequest();
  await expect.poll(async () => (await getNaverHarnessState(page))?.pendingTilesloaded ?? 0).toBe(1);
  await releaseNaverTiles(page);

  const map = page.getByRole("img", { name: /속초해수욕장 인근\(샘플\) 위치 지도/ });
  await expect(map).toHaveAttribute("data-naver-test-map", "ready");
  const detailHeading = page.getByRole("heading", { level: 1, name: /바다빛 가족 문화축제/ });
  const locationSection = page.getByRole("heading", { name: "속초해수욕장 인근(샘플)" }).locator("..");
  await expectNoHorizontalOverflow(page, [
    page.getByRole("main").filter({ has: detailHeading }),
    page.locator("article").first(),
    locationSection,
    map,
  ]);
});

test("목록에서 필터하고 상세·원문·주변 명소를 확인한다", async ({ context, page }) => {
  await context.route("https://www.sokcho.go.kr/**", (route) => route.abort());
  await context.route("https://oapi.map.naver.com/**", (route) => route.abort("blockedbyclient"));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "요즘 속초에서 뭐 하지?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /찾은 행사 8개/ })).toBeVisible();
  await page.getByRole("link", { name: "가족", exact: true }).click();
  await expect(page).toHaveURL(/audience=family/);
  await expect(page.getByRole("heading", { name: /찾은 행사 7개/ })).toBeVisible();

  await page.getByRole("link", { name: /바다빛 가족 문화축제/ }).click();
  await expect(page).toHaveURL(/\/events\/demo-sea-family-festival$/);
  await expect(page.getByRole("heading", { level: 1, name: /바다빛 가족 문화축제/ })).toBeVisible();

  const mapFallback = page.getByRole("status").filter({ hasText: "지도를 불러오지 못했습니다." });
  await expect(mapFallback).toBeVisible();
  const mapFallbackBox = await mapFallback.boundingBox();
  expect(mapFallbackBox).not.toBeNull();
  expect(mapFallbackBox!.height).toBe(288);

  const sourceLink = page.getByRole("link", { name: /공식 원문/ }).first();
  await expect(sourceLink).toHaveAttribute("href", "https://www.sokcho.go.kr/");
  await expect(sourceLink).toHaveAttribute("target", "_blank");
  await expect(sourceLink).toHaveAccessibleName("공식 원문 (새 창)");
  const popupPromise = page.waitForEvent("popup");
  await sourceLink.click();
  const popup = await popupPromise;
  await popup.close();

  await expect(page.getByRole("link", { name: /네이버 지도/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /카카오맵/ })).toHaveCount(0);

  const nearby = page.getByRole("region", { name: "주변 명소 둘러보기" });
  await expect(nearby).toBeVisible();
  await expect(nearby.getByRole("article")).toHaveCount(4);
  await expect(nearby.getByRole("link", { name: /지도에서 보기/ }).first()).toBeVisible();
});
