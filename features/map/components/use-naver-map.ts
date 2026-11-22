// 네이버 지도 SDK의 지도를 만들고 지우는 hook(event-map.tsx). 지도 상태(status)와 지도(mapRef)는 화면이 가진다:
// 마커 hook(use-map-markers.ts)이 이 hook보다 먼저 effect를 등록해야 화면을 떠날 때 마커를 뗀 뒤 지도를 지운다(정리는 등록 순서대로 돈다).
import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { DEFAULT_ZOOM, MIN_ZOOM } from "@/features/map/components/map-camera";
import { readMapView, saveMapView } from "@/features/map/components/map-history";
import { callNaverMapsSafely, getNaverMaps, listenNaverMapsAuthFailure, type NaverMap } from "@/features/map/components/naver-maps";
import { MAP_DEFAULT_CENTER, MAP_REGION_BOUNDS } from "@/features/map/model/map-pins";
import type { AnalyticsEventParams } from "@/lib/analytics/events";

export type MapUnavailableReason = AnalyticsEventParams["map_unavailable"]["reason"];
/** 지도 SDK 상태. 실패하면 이유를 남겨 GA(map_unavailable)로 보낸다. 키가 없는 경우(missing_key)는 SDK를 부르지 않아 여기 없다. */
export type MapStatus = "loading" | "ready" | Exclude<MapUnavailableReason, "missing_key">;

/**
 * SDK를 불러온 뒤 지도를 한 번 만들고, 화면을 떠나면 지운다. 등록하지 않은 주소에서 열었거나 키가 틀리면 SDK가 알려 auth_failed로 바꾼다.
 * 이 칸에 남은 지도 보기가 있으면(상세에 갔다가 돌아옴) 그 가운데·확대 수준으로 연다(map-history.ts).
 * 돌려주는 mapIdleCount는 지도 움직임(확대·축소, 이동)이 끝날 때마다 늘어, 마커 배치를 다시 계산하게 한다.
 */
export function useNaverMap({
  isSdkLoaded,
  containerRef,
  mapRef,
  setStatus,
}: {
  isSdkLoaded: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<NaverMap | null>;
  setStatus: Dispatch<SetStateAction<MapStatus>>;
}) {
  const [mapIdleCount, setMapIdleCount] = useState(0);
  // 지도 보기를 되살렸는지. 되살렸으면 화면은 처음에 핀 맞추기·장소로 확대하기를 하지 않는다.
  const isViewRestoredRef = useRef(false);

  useEffect(() => listenNaverMapsAuthFailure(() => setStatus("auth_failed")), [setStatus]);

  useEffect(() => {
    const naverMaps = isSdkLoaded ? getNaverMaps() : null;
    const container = containerRef.current;
    if (naverMaps === null || container === null) return;

    const savedView = readMapView();
    isViewRestoredRef.current = savedView !== null;
    const newMap = new naverMaps.Map(container, {
      center: new naverMaps.LatLng(savedView?.latitude ?? MAP_DEFAULT_CENTER.latitude, savedView?.longitude ?? MAP_DEFAULT_CENTER.longitude),
      zoom: savedView?.zoom ?? DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: new naverMaps.LatLngBounds(
        new naverMaps.LatLng(MAP_REGION_BOUNDS.south, MAP_REGION_BOUNDS.west),
        new naverMaps.LatLng(MAP_REGION_BOUNDS.north, MAP_REGION_BOUNDS.east),
      ),
      // 끌기 대신 누를 수 있는 확대·축소 버튼(WCAG 2.5.7). 오른쪽 위(분야 칩 아래)에 둔다: 오른쪽 가운데는 모바일 장소 카드(최대 60%)에
      // 가려졌고, 왼쪽은 md 이상의 장소 카드 자리다(2026-11-16 사용자 결정).
      zoomControl: true,
      zoomControlOptions: { position: naverMaps.Position.RIGHT_TOP },
      scaleControl: false,
      mapDataControl: true,
      logoControlOptions: { position: naverMaps.Position.TOP_RIGHT },
    });
    mapRef.current = newMap;
    // 인증 실패가 지도를 만들기 전에 먼저 알려졌으면 그 실패를 덮어쓰지 않는다.
    setStatus((current) => (current === "loading" ? "ready" : current));

    function handleResize() {
      newMap.autoResize();
    }
    // 지도 상자는 넘침을 숨기지만(SDK가 overflow: hidden을 넣음) 브라우저는 초점 이동·scrollIntoView 때 숨긴 영역도 스크롤한다.
    // 화면 가장자리에 걸친 장소 이름 알약 때문에 상자 안쪽이 넓어져, Tab으로 가장자리 핀에 초점이 가면 SDK 모르게 지도 전체가 밀렸다(2026-11-21).
    function handleContainerScroll() {
      if (container !== null && (container.scrollLeft !== 0 || container.scrollTop !== 0)) container.scrollTo(0, 0);
    }
    window.addEventListener("resize", handleResize);
    container.addEventListener("scroll", handleContainerScroll);
    // 움직임이 끝날 때마다 이 칸에 지도 보기를 남긴다. 상세에 갔다가 돌아오면 이 값으로 연다(2026-11-22 사용자 결정).
    const idleListener = naverMaps.Event.addListener(newMap, "idle", () => {
      setMapIdleCount((count) => count + 1);
      callNaverMapsSafely(() => {
        const center = newMap.getCenter();
        saveMapView({ latitude: center.lat(), longitude: center.lng(), zoom: newMap.getZoom() });
      });
    });
    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("scroll", handleContainerScroll);
      callNaverMapsSafely(() => naverMaps.Event.removeListener(idleListener));
      callNaverMapsSafely(() => newMap.destroy());
      mapRef.current = null;
      // 지도를 다시 만들면(개발 모드 StrictMode의 다시 붙이기 등) ready로 다시 바뀌어 핀 effect가 새 지도에 핀을 그린다.
      setStatus((current) => (current === "ready" ? "loading" : current));
    };
  }, [isSdkLoaded, containerRef, mapRef, setStatus]);

  return { mapIdleCount, isViewRestoredRef };
}
