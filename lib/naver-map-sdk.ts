export type NaverMapInstance = {
  destroy(): void;
};

export type NaverMarkerInstance = {
  setMap(map: NaverMapInstance | null): void;
};

export type NaverMapEventListener = object;

export type NaverMaps = {
  LatLng: new (latitude: number, longitude: number) => object;
  Map: new (
    container: HTMLElement,
    options: {
      center: object;
      zoom: number;
      draggable: boolean;
      pinchZoom: boolean;
      scrollWheel: boolean;
      keyboardShortcuts: boolean;
      disableDoubleClickZoom: boolean;
      disableDoubleTapZoom: boolean;
      disableTwoFingerTapZoom: boolean;
    },
  ) => NaverMapInstance;
  Marker: new (options: {
    map: NaverMapInstance;
    position: object;
    title: string;
  }) => NaverMarkerInstance;
  Event: {
    once(
      target: NaverMapInstance,
      eventName: "tilesloaded",
      listener: () => void,
    ): NaverMapEventListener;
    removeListener(listener: NaverMapEventListener): void;
  };
};

declare global {
  interface Window {
    naver?: { maps?: NaverMaps };
    navermap_authFailure?: () => void;
  }
}

const NAVER_MAPS_SDK_URL = "https://oapi.map.naver.com/openapi/v3/maps.js";
const SDK_SCRIPT_ATTRIBUTE = "data-sokcho-moa-naver-maps-sdk";

let sdkPromise: Promise<NaverMaps> | null = null;
let cancelSdkLoad: ((reason: Error) => void) | null = null;
let sdkInvalidated = false;
let sdkLoadState: "idle" | "loading" | "ready" = "idle";
const authFailureListeners = new Set<() => void>();
let previousAuthFailure: (() => void) | undefined;
let authFailureBridgeInstalled = false;

function removeNaverMapsScript() {
  document.querySelector(`script[${SDK_SCRIPT_ATTRIBUTE}]`)?.remove();
}

function invalidateNaverMapsSdk(reason: Error) {
  const cancelPendingLoad = cancelSdkLoad;
  cancelSdkLoad = null;
  sdkPromise = null;
  sdkInvalidated = true;
  sdkLoadState = "idle";
  try {
    cancelPendingLoad?.(reason);
  } catch {}
  try {
    removeNaverMapsScript();
  } catch {}
  try {
    if (window.naver) delete window.naver.maps;
  } catch {}
}

function callAuthFailureHandler(handler: (() => void) | undefined) {
  try {
    handler?.();
  } catch {}
}

function authFailureBridge() {
  try {
    invalidateNaverMapsSdk(new Error("네이버 지도 인증에 실패했습니다."));
  } catch {}
  for (const listener of [...authFailureListeners]) callAuthFailureHandler(listener);
  callAuthFailureHandler(previousAuthFailure);
}

function installAuthFailureBridge() {
  if (authFailureBridgeInstalled) return;
  previousAuthFailure = window.navermap_authFailure;
  window.navermap_authFailure = authFailureBridge;
  authFailureBridgeInstalled = true;
}

function restoreAuthFailureHandler() {
  if (!authFailureBridgeInstalled) return;
  if (window.navermap_authFailure === authFailureBridge) {
    if (previousAuthFailure) {
      window.navermap_authFailure = previousAuthFailure;
    } else {
      delete window.navermap_authFailure;
    }
  }
  previousAuthFailure = undefined;
  authFailureBridgeInstalled = false;
}

export function subscribeNaverMapAuthFailure(listener: () => void) {
  installAuthFailureBridge();
  authFailureListeners.add(listener);

  return () => {
    authFailureListeners.delete(listener);
    if (authFailureListeners.size === 0) restoreAuthFailureHandler();
  };
}

export function createNaverMapsSdkUrl(clientId: string) {
  const url = new URL(NAVER_MAPS_SDK_URL);
  url.searchParams.set("ncpKeyId", clientId);
  return url.toString();
}

export function loadNaverMaps(clientId: string): Promise<NaverMaps> {
  const availableMaps = window.naver?.maps;
  if (!sdkInvalidated && availableMaps) return Promise.resolve(availableMaps);
  if (sdkLoadState === "ready" && !availableMaps) {
    sdkPromise = null;
    sdkInvalidated = true;
    sdkLoadState = "idle";
    removeNaverMapsScript();
  }
  if (sdkLoadState === "loading" && sdkPromise) return sdkPromise;

  sdkLoadState = "loading";

  const loadingPromise = new Promise<NaverMaps>((resolve, reject) => {
    let settled = false;
    const script = document.createElement("script");
    const finish = () => {
      window.clearTimeout(timeout);
      if (cancelSdkLoad === cancel) cancelSdkLoad = null;
    };
    const succeed = (maps: NaverMaps) => {
      if (settled) return;
      settled = true;
      finish();
      sdkInvalidated = false;
      sdkLoadState = "ready";
      resolve(maps);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      finish();
      removeNaverMapsScript();
      reject(error);
    };
    const cancel = (reason: Error) => fail(reason);
    const timeout = window.setTimeout(
      () => fail(new Error("네이버 지도 SDK 응답 시간이 초과되었습니다.")),
      8_000,
    );

    cancelSdkLoad = cancel;
    script.src = createNaverMapsSdkUrl(clientId);
    script.async = true;
    script.setAttribute(SDK_SCRIPT_ATTRIBUTE, "true");
    script.onload = () => {
      if (!window.naver?.maps) {
        fail(new Error("네이버 지도 SDK를 초기화하지 못했습니다."));
        return;
      }
      succeed(window.naver.maps);
    };
    script.onerror = () => fail(new Error("네이버 지도 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  const guardedPromise = loadingPromise.catch((error) => {
    if (sdkPromise === guardedPromise) {
      sdkPromise = null;
      sdkLoadState = "idle";
    }
    throw error;
  });
  sdkPromise = guardedPromise;

  return sdkPromise;
}
