"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getButtonClassName } from "@/components/ui/button-styles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EventMapClusterMarker, EventMapMarker, PlaceMapMarker } from "@/features/events/components/map/event-map-marker";
import {
  fitPins,
  getCenterShowingPin,
  getUncoveredMapArea,
  isPinInArea,
  PLACE_ZOOM,
  SIDE_PANEL_MEDIA_QUERY,
} from "@/features/events/components/map/map-camera";
import { MapCategoryChips } from "@/features/events/components/map/map-category-chips";
import { closeMapPlace, openMapPlace, replaceMapQuery } from "@/features/events/components/map/map-history";
import { MapPinList } from "@/features/events/components/map/map-pin-list";
import { MapPlacePanel } from "@/features/events/components/map/map-place-panel";
import { callNaverMapsSafely, getNaverMaps, hasNaverMapsAuthFailed, NAVER_MAPS_SCRIPT_URL, type NaverMap } from "@/features/events/components/map/naver-maps";
import { CLUSTER_EXPAND_MAX_ZOOM, useMapMarkerLayout } from "@/features/events/components/map/use-map-marker-layout";
import { useMapMarkers } from "@/features/events/components/map/use-map-markers";
import { useNaverMap, type MapStatus, type MapUnavailableReason } from "@/features/events/components/map/use-naver-map";
import {
  createMapFilter,
  filterEventMapPlaces,
  filterPlaceMapPins,
  isPinInFilter,
  type MapFilter,
  type MapLayer,
  type MapPin,
  type PlaceMapPin,
  type VenueMapPin,
} from "@/features/events/model/event-map";
import { categoryLabels } from "@/features/events/model/taxonomy";
import { activityCategoryLabels } from "@/features/places/model/activity";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

/**
 * 지도 탭(.ai/DESIGN.md 지도). 장소 핀을 누르면 지도 아래(md 이상은 왼쪽)에 그 장소의 행사 카드가 열리고, 카드를 누르면 상세로 간다.
 * 상세를 시트·모달에 통째로 넣지 않는다: 시트로 페이지 이동을 대신하지 말라는 권고(NN/g Bottom Sheets, 2023)를 따랐다(2026-11-16).
 * 고른 분야(?category=)와 장소(?place=)는 주소에 남기고 지도 보기는 기록 칸에 남겨(map-history.ts), 상세에서 돌아오면 같은 화면으로 돌아오고 뒤로 가기로 카드를 닫는다.
 * 지도 만들기는 use-naver-map.ts, 마커는 use-map-markers.ts, 마커 묶기·이름 배치는 use-map-marker-layout.ts, 보기 계산은 map-camera.ts가 맡는다.
 * 마커 모양은 event-map-marker.tsx, 크기는 map-marker-icon.ts, 카드는 map-place-panel.tsx가 맡는다.
 */
export function EventMap({
  pins,
  placePins,
  cards,
  clientId,
}: {
  pins: VenueMapPin[];
  /** "가볼만한 곳" 장소 핀. 레이어(?layer=places)를 고르면 행사 핀 대신 보인다(2026-11-21). */
  placePins: PlaceMapPin[];
  /** 행사 slug 또는 장소 핀 id → 서버가 그린 카드 */
  cards: Record<string, ReactNode>;
  clientId: string | null;
}) {
  const searchParams = useSearchParams();
  const layerParam: MapLayer = searchParams.get("layer") === "places" ? "places" : "events";
  const categoryParam = searchParams.get("category");
  const filter = useMemo(() => createMapFilter(layerParam, categoryParam), [layerParam, categoryParam]);
  const placeId = searchParams.get("place");
  const allPins = useMemo<MapPin[]>(() => [...pins, ...placePins], [pins, placePins]);
  const visiblePins = useMemo<MapPin[]>(
    () => (filter.layer === "places" ? filterPlaceMapPins(placePins, filter.category) : filterEventMapPlaces(pins, filter.category)),
    [filter, pins, placePins],
  );
  const selectedPin = visiblePins.find((pin) => pin.id === placeId) ?? null;
  const selectedPinId = selectedPin?.id ?? null;

  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  // 이 탭에서 인증이 이미 실패했으면 SDK가 다시 알려 주지 않으므로 처음부터 실패로 둔다(naver-maps.ts).
  const [status, setStatus] = useState<MapStatus>(() => (hasNaverMapsAuthFailed() ? "auth_failed" : "loading"));
  const unavailableReason: MapUnavailableReason | null = clientId === null
    ? "missing_key"
    : status === "auth_failed" || status === "script_error" ? status : null;
  const isMapUnavailable = unavailableReason !== null;
  // 지도 SDK의 지도. 지도가 있는지는 status("ready")로 알리고, effect는 status가 바뀔 때 이 값을 읽는다.
  const mapRef = useRef<NaverMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  // 핀을 눌러 카드를 열었을 때만 카드 제목으로 초점을 옮긴다. 주소(?place=)로 바로 열면 옮기지 않는다:
  // 아무 조작도 없는 상태의 초점은 전역 :focus-visible 테두리(globals.css)가 그대로 보여 제목에 진한 테두리가 남았다.
  const shouldFocusPanelRef = useRef(false);
  // 핀이 다 보이게 맞춘 지도와 핀 구성. 처음 열 때(지도를 새로 만들 때)와 분야를 바꿀 때만 다시 맞추고, 장소를 고를 때는 맞추지 않는다.
  const fittedRef = useRef<{ map: NaverMap; pinsKey: string } | null>(null);
  // 주소(?place=)로 바로 연 장소는 처음 한 번 그 장소로 확대해 간다. 이후에 고른 장소는 확대 수준을 두고 옮기기만 한다.
  const shouldZoomToSelectedRef = useRef(false);
  const reportedUnavailableRef = useRef(false);

  // 마커 hook을 지도 hook보다 먼저 부른다: 화면을 떠날 때 마커를 뗀 뒤 지도를 지운다(use-naver-map.ts).
  const markerSlots = useMapMarkers({ mapRef, status, allPins, selectedPinId });
  const { mapIdleCount, isViewRestoredRef } = useNaverMap({ isSdkLoaded, containerRef, mapRef, setStatus });
  const markerLayout = useMapMarkerLayout({ mapRef, status, markerSlots, visiblePins, selectedPinId, mapIdleCount, containerRef });

  function handleSelectPinFromMarker(pinId: string) {
    handleSelectPin(pinId, "pin");
  }

  // method: 핀을 눌렀는지, md 이상 왼쪽 목록 판에서 골랐는지(GA select_method, 2026-11-21).
  function handleSelectPin(pinId: string, method: "pin" | "list") {
    // 이미 고른 핀을 다시 누르면 아무것도 하지 않는다. 예전에는 GA map_place_selected가 한 번 더 갔다(2026-11-16 리뷰).
    if (pinId === selectedPinId) return;
    const pin = visiblePins.find((candidate) => candidate.id === pinId);
    if (!pin) return;
    shouldFocusPanelRef.current = true;
    openMapPlace({ ...filter, placeId: pinId }, selectedPin !== null);
    trackAnalyticsEvent("map_place_selected", {
      map_category: getMapCategoryValue(filter),
      event_count: pin.kind === "place" ? 0 : pin.events.length,
      select_method: method,
    });
  }

  // 묶음을 누르면 묶인 장소가 다 보이게 확대한다. 확대가 끝나면(idle) 마커 배치를 다시 계산해 묶음이 풀린다.
  function handleExpandCluster(memberIds: readonly string[]) {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    if (naverMaps === null || map === null) return;
    const members = visiblePins.filter((pin) => memberIds.includes(pin.id));
    callNaverMapsSafely(() => fitPins(naverMaps, map, members, CLUSTER_EXPAND_MAX_ZOOM));
  }

  function handleClosePanel() {
    closeMapPlace(filter);
    // 닫으면 연 핀으로 초점을 돌려준다(키보드 사용자가 지도에서 길을 잃지 않게).
    markerSlots.find((slot) => slot.pin.id === selectedPinId)?.container.querySelector("button")?.focus({ preventScroll: true });
  }

  function handleSelectCategory(nextCategory: string | null) {
    const nextFilter = createMapFilter(filter.layer, nextCategory);
    if (nextFilter.category === filter.category) return;
    const isPlaceStillVisible = selectedPin !== null && isPinInFilter(selectedPin, nextFilter);
    replaceMapQuery({ ...nextFilter, placeId: isPlaceStillVisible ? selectedPin.id : null });
    trackAnalyticsEvent("map_category_changed", { map_category: getMapCategoryValue(nextFilter) });
  }

  // 레이어(행사 | 가볼만한 곳)를 바꾸면 분야와 고른 장소를 비운다. 두 레이어의 분야 값이 다르다.
  function handleSelectLayer(nextLayer: MapLayer) {
    if (nextLayer === filter.layer) return;
    const nextFilter = createMapFilter(nextLayer, null);
    replaceMapQuery({ ...nextFilter, placeId: null });
    trackAnalyticsEvent("map_category_changed", { map_category: getMapCategoryValue(nextFilter) });
  }

  // 지도를 볼 수 없게 되면 이유를 한 화면에 한 번만 보낸다. 운영에서 키·주소 등록이 빠지면 안내 문구만 보여 조용히 죽어 있기 때문이다.
  useEffect(() => {
    if (unavailableReason === null || reportedUnavailableRef.current) return;
    reportedUnavailableRef.current = true;
    trackAnalyticsEvent("map_unavailable", { reason: unavailableReason });
  }, [unavailableReason]);

  // 지도에 없는 장소(행사가 끝나 핀이 사라졌거나 고른 분야에 없는 장소)는 주소에서 뺀다. 남겨 두면 카드 없이 주소만 남았다(2026-11-16 리뷰).
  useEffect(() => {
    if (placeId !== null && selectedPin === null) replaceMapQuery({ ...filter, placeId: null });
  }, [placeId, selectedPin, filter]);

  // 보이는 범위. 처음 열 때와 분야를 바꿀 때만 핀이 다 보이게 맞춘다. 주소에 장소가 있으면 처음에는 맞추지 않고
  // 아래 장소 effect가 그 장소로 확대해 간다(같은 때 두 번 옮기면 뒤의 이동이 앞의 확대를 끊을 수 있다).
  // 상세에서 돌아와 지도 보기를 되살렸으면 처음에는 아무것도 옮기지 않는다(2026-11-22 사용자 결정).
  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    if (naverMaps === null || map === null || status !== "ready") return;

    const pinsKey = visiblePins.map((pin) => pin.id).join("|");
    const fitted = fittedRef.current;
    if (fitted !== null && fitted.map === map && fitted.pinsKey === pinsKey) return;
    const isFirstFit = fitted === null || fitted.map !== map;
    fittedRef.current = { map, pinsKey };

    if (isFirstFit && isViewRestoredRef.current) return;
    if (isFirstFit && selectedPin !== null) shouldZoomToSelectedRef.current = true;
    else callNaverMapsSafely(() => fitPins(naverMaps, map, visiblePins));
  }, [status, visiblePins, selectedPin, isViewRestoredRef]);

  // 고른 장소. 핀을 눌러 열었으면 카드 제목으로 초점을 옮기고, 핀이 카드나 화면 가장자리에 가리면 카드에 가리지 않는 곳의 가운데로 옮긴다.
  // 예전에는 고를 때마다 지도 안쪽 여백(padding)을 카드 크기로 바꾸고 핀을 가운데로 끌어왔다. 여백을 바꾸는 순간 지도가 한 번 밀린 뒤
  // 다시 움직여 덜컹거렸고(닫을 때도 여백을 되돌리며 밀림), 잘 보이는 핀도 매번 움직였다(2026-11-21 사용자 피드백: 어지러움).
  // 이제 여백은 두지 않고, 가릴 때만 옮길 자리를 계산해 한 번에 옮긴다. 동작 줄이기 설정이면 애니메이션 없이 옮긴다.
  const selectedLatitude = selectedPin?.latitude ?? null;
  const selectedLongitude = selectedPin?.longitude ?? null;
  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    const panel = panelRef.current;
    const container = containerRef.current;
    if (selectedPinId === null || selectedLatitude === null || selectedLongitude === null || panel === null) return;
    if (shouldFocusPanelRef.current) {
      shouldFocusPanelRef.current = false;
      panelTitleRef.current?.focus({ preventScroll: true });
    }
    if (naverMaps === null || map === null || container === null || status !== "ready") return;

    const visibleArea = getUncoveredMapArea(container, panel, window.matchMedia(SIDE_PANEL_MEDIA_QUERY).matches);
    callNaverMapsSafely(() => {
      const pin = new naverMaps.LatLng(selectedLatitude, selectedLongitude);
      if (shouldZoomToSelectedRef.current) {
        // 주소(?place=)로 바로 연 장소: 그 장소로 확대해 가되, 도착했을 때 카드에 가리지 않는 곳의 가운데에 오게 한다.
        shouldZoomToSelectedRef.current = false;
        map.morph(getCenterShowingPin(naverMaps, map, pin, visibleArea, PLACE_ZOOM), PLACE_ZOOM);
        return;
      }
      if (isPinInArea(map, pin, visibleArea)) return;
      const nextCenter = getCenterShowingPin(naverMaps, map, pin, visibleArea, map.getZoom());
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) map.setCenter(nextCenter);
      else map.panTo(nextCenter);
    });
  }, [selectedPinId, selectedLatitude, selectedLongitude, status]);

  // 장소를 고른 채 지도의 빈 곳을 누르면 카드를 닫고 고른 표시와 마커 초점을 없앤다(2026-11-21 사용자 요청).
  // 마우스로 닫은 것이라 닫기 버튼과 달리 핀으로 초점을 돌려주지 않는다. 마커를 누른 것이면(지도 SDK가 함께 알릴 수 있음) 무시한다.
  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    if (naverMaps === null || map === null || status !== "ready" || selectedPinId === null) return;
    const listener = naverMaps.Event.addListener(map, "click", (event) => {
      const target = (event.pointerEvent ?? event.domEvent)?.target;
      if (target instanceof Element && target.closest("[data-map-marker]") !== null) return;
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && focused.closest("[data-map-marker]") !== null) focused.blur();
      closeMapPlace(filter);
    });
    return () => {
      callNaverMapsSafely(() => naverMaps.Event.removeListener(listener));
    };
  }, [status, selectedPinId, filter]);

  const selectedCategoryLabel = getCategoryLabel(filter);
  // 빈 지도 안내의 문장과 돌아갈 목록을 레이어에 맞춘다. 예전에는 "행사이 없어요"로 조사가 깨지고, 가볼만한 곳에서도 행사 목록으로 보냈다(2026-11-22 리뷰).
  const layerListLink = filter.layer === "places" ? { href: "/places", label: "가볼만한 곳 목록 보기" } : { href: "/", label: "행사 목록 보기" };
  const emptyLayerMessage = filter.layer === "places" ? "지도에 표시할 가볼만한 곳이 없어요." : "지도에 표시할 행사가 없어요.";
  const visiblePinById = new Map(visiblePins.map((pin) => [pin.id, pin]));

  return (
    // md 이상은 왼쪽에 고정 폭 판(전환·분야·장소 목록)을 두고 오른쪽을 지도로 채운다(시안 D, 2026-11-21 사용자 결정).
    // 예전처럼 지도 위 가운데 줄에 두면 레이어를 바꿀 때 칩 길이가 달라 줄이 옆으로 밀렸다.
    <div className="flex h-full flex-col md:flex-row">
      {clientId !== null && (
        <Script
          src={`${NAVER_MAPS_SCRIPT_URL}?ncpKeyId=${encodeURIComponent(clientId)}`}
          strategy="afterInteractive"
          onReady={() => setIsSdkLoaded(true)}
          onError={() => setStatus("script_error")}
        />
      )}

      <div className="flex shrink-0 flex-col bg-surface md:w-80 md:border-r md:border-line">
        <MapCategoryChips layer={filter.layer} category={filter.category} onSelectLayer={handleSelectLayer} onSelectCategory={handleSelectCategory} />
        {/* 모바일은 지도를 넓게 쓰려고 목록을 두지 않는다. 핀과 아래 장소 카드로 고른다. */}
        <div className="hidden min-h-0 flex-1 flex-col md:flex">
          {!isMapUnavailable && <MapPinList pins={visiblePins} selectedId={selectedPinId} onSelect={(pinId) => handleSelectPin(pinId, "list")} />}
        </div>
      </div>

      <div className="relative min-h-0 min-w-0 flex-1 bg-surface-muted">
        {/* 지도 SDK가 지도 상자에 position: relative를 덮어써서, 자리는 바깥 상자가 잡고 지도는 그 안을 채운다. */}
        {/* isolate: 지도 SDK의 확대 버튼·로고가 쓰는 큰 z-index가 이 상자 안에서만 겹치게 해 장소 카드 위로 올라오지 않는다. */}
        <div className="absolute inset-0 isolate" aria-hidden={isMapUnavailable}>
          <div ref={containerRef} className="size-full" />
        </div>
        {markerSlots.map(({ pin, container }) => {
          const visiblePin = visiblePinById.get(pin.id);
          if (visiblePin === undefined || markerLayout.hiddenIds.has(pin.id)) return null;
          const clusterMemberIds = markerLayout.clusterMemberIds.get(pin.id);
          if (clusterMemberIds !== undefined) {
            const eventCount = visiblePins
              .filter((candidate) => clusterMemberIds.includes(candidate.id))
              .reduce((sum, candidate) => sum + (candidate.kind === "place" ? 0 : candidate.events.length), 0);
            return createPortal(
              <EventMapClusterMarker
                placeCount={clusterMemberIds.length}
                eventCount={filter.layer === "places" ? null : eventCount}
                onExpand={() => handleExpandCluster(clusterMemberIds)}
              />,
              container,
              pin.id,
            );
          }
          const isLabelShown = markerLayout.labeledIds.has(visiblePin.id);
          const isSelected = visiblePin.id === selectedPinId;
          return createPortal(
            visiblePin.kind === "place"
              ? <PlaceMapMarker pin={visiblePin} isLabelShown={isLabelShown} isSelected={isSelected} onSelect={handleSelectPinFromMarker} />
              : <EventMapMarker pin={visiblePin} isLabelShown={isLabelShown} isSelected={isSelected} onSelect={handleSelectPinFromMarker} />,
            container,
            pin.id,
          );
        })}

        {/* SDK를 불러오는 동안(느린 회선에서 몇 초) 빈 회색 판만 보이지 않게 가운데에 스피너를 둔다(2026-11-16 사용자 결정). */}
        {clientId !== null && status === "loading" && (
          <div role="status" className="pointer-events-none absolute inset-0 grid place-items-center text-primary">
            <LoadingSpinner className="size-8" />
            <span className="sr-only">지도를 불러오는 중</span>
          </div>
        )}

        {isMapUnavailable ? (
          <MapNotice message="지금은 지도를 볼 수 없어요.">
            <Link href={layerListLink.href} className={getButtonClassName({ variant: "tonal" })}>{layerListLink.label}</Link>
          </MapNotice>
        ) : status === "ready" && visiblePins.length === 0 ? (
          <MapNotice message={selectedCategoryLabel === null ? emptyLayerMessage : `지도에 표시할 ${selectedCategoryLabel} ${filter.layer === "places" ? "장소가" : "일정이"} 없어요.`}>
            {selectedCategoryLabel === null ? (
              <Link href={layerListLink.href} className={getButtonClassName({ variant: "tonal" })}>{layerListLink.label}</Link>
            ) : (
              <button type="button" onClick={() => handleSelectCategory(null)} className={getButtonClassName({ variant: "tonal" })}>전체 보기</button>
            )}
          </MapNotice>
        ) : null}

        {selectedPin !== null && (
          <MapPlacePanel pin={selectedPin} cards={cards} ref={panelRef} titleRef={panelTitleRef} onClose={handleClosePanel} />
        )}
      </div>
    </div>
  );
}

/** 고른 분야의 이름. 전체면 null */
function getCategoryLabel(filter: MapFilter) {
  if (filter.category === null) return null;
  return filter.layer === "places" ? activityCategoryLabels[filter.category] : categoryLabels[filter.category];
}

/** GA map_category 값: 행사 분야는 그대로(전체는 all), 가볼만한 곳은 places 또는 places:분류. 예전 값과 섞이지 않게 앞에 붙인다. */
function getMapCategoryValue(filter: MapFilter) {
  if (filter.layer === "places") return filter.category === null ? "places" : `places:${filter.category}`;
  return filter.category ?? "all";
}

function MapNotice({ message, children }: { message: string; children: ReactNode }) {
  return (
    <div className="absolute inset-x-4 top-6 z-10 mx-auto flex max-w-sm flex-col items-center gap-3 rounded-card bg-surface p-5 text-center shadow-floating">
      <p className="text-body text-content-strong">{message}</p>
      {children}
    </div>
  );
}
