"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getButtonClassName } from "@/components/ui/button-styles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EventMapMarker } from "@/features/events/components/map/event-map-marker";
import { MapCategoryChips } from "@/features/events/components/map/map-category-chips";
import { closeMapPlace, openMapPlace, replaceMapQuery } from "@/features/events/components/map/map-history";
import {
  createMarkerContainer,
  createMarkerIcon,
  FIT_PINS_PADDING_PX,
  getMarkerSize,
  getPinLabel,
  type MarkerSize,
} from "@/features/events/components/map/map-marker-icon";
import { MapPlacePanel } from "@/features/events/components/map/map-place-panel";
import {
  getNaverMaps,
  hasNaverMapsAuthFailed,
  listenNaverMapsAuthFailure,
  NAVER_MAPS_SCRIPT_URL,
  type NaverMap,
  type NaverMapsApi,
  type NaverMarker,
} from "@/features/events/components/map/naver-maps";
import { filterEventMapPlaces, MAP_DEFAULT_CENTER, MAP_REGION_BOUNDS, type EventMapPin } from "@/features/events/model/event-map";
import { categoryLabels, isEventCategory, type EventCategory } from "@/features/events/model/taxonomy";
import { trackAnalyticsEvent, type AnalyticsEventParams } from "@/lib/analytics/events";

type MapUnavailableReason = AnalyticsEventParams["map_unavailable"]["reason"];
/** 지도 SDK 상태. 실패하면 이유를 남겨 GA(map_unavailable)로 보낸다. 키가 없는 경우(missing_key)는 SDK를 부르지 않아 여기 없다. */
type MapStatus = "loading" | "ready" | Exclude<MapUnavailableReason, "missing_key">;

/** 지도에 올린 핀 하나. 지도 SDK 마커와 그 마커 상자(안의 내용은 React가 portal로 그린다)를 함께 둔다. pin은 분야로 거르기 전 장소다. */
interface MarkerSlot {
  pin: EventMapPin;
  marker: NaverMarker;
  container: HTMLDivElement;
}

/** 지도를 처음 열 때와 분야를 바꿀 때의 확대 수준. 속초 시내 전체가 보이고, 고성·양양까지 줄여 볼 수 있다. */
const DEFAULT_ZOOM = 13;
const MIN_ZOOM = 10;
/** 장소를 고르거나 핀이 하나뿐일 때의 확대 수준(골목이 보이는 정도) */
const PLACE_ZOOM = 15;
/** 장소 카드가 지도 아래 시트가 아니라 왼쪽 판으로 열리는 폭(Tailwind md) */
const SIDE_PANEL_MEDIA_QUERY = "(width >= 48rem)";

/**
 * 지도 탭(.ai/DESIGN.md 지도). 장소 핀을 누르면 지도 아래(md 이상은 왼쪽)에 그 장소의 행사 카드가 열리고, 카드를 누르면 상세로 간다.
 * 상세를 시트·모달에 통째로 넣지 않는다: 시트로 페이지 이동을 대신하지 말라는 권고(NN/g Bottom Sheets, 2023)를 따랐다(2026-11-16).
 * 고른 분야(?category=)와 장소(?place=)는 주소에 남겨(map-history.ts), 상세에서 뒤로 오면 같은 화면으로 돌아오고 뒤로 가기로 카드를 닫는다.
 * 마커 모양은 event-map-marker.tsx, 크기는 map-marker-icon.ts, 카드는 map-place-panel.tsx가 맡는다.
 */
export function EventMap({
  pins,
  cards,
  clientId,
}: {
  pins: EventMapPin[];
  /** 행사 slug → 서버가 그린 행사 카드 */
  cards: Record<string, ReactNode>;
  clientId: string | null;
}) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? undefined;
  const category = isEventCategory(categoryParam) ? categoryParam : null;
  const placeId = searchParams.get("place");
  const visiblePins = useMemo(() => filterEventMapPlaces(pins, category), [pins, category]);
  const selectedPin = visiblePins.find((pin) => pin.id === placeId) ?? null;

  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  // 이 탭에서 인증이 이미 실패했으면 SDK가 다시 알려 주지 않으므로 처음부터 실패로 둔다(naver-maps.ts).
  const [status, setStatus] = useState<MapStatus>(() => (hasNaverMapsAuthFailed() ? "auth_failed" : "loading"));
  const unavailableReason: MapUnavailableReason | null = clientId === null
    ? "missing_key"
    : status === "auth_failed" || status === "script_error" ? status : null;
  const isMapUnavailable = unavailableReason !== null;
  // 지도 SDK의 지도. 지도가 있는지는 status("ready")로 알리고, effect는 status가 바뀔 때 이 값을 읽는다.
  const mapRef = useRef<NaverMap | null>(null);
  const [markerSlots, setMarkerSlots] = useState<MarkerSlot[]>([]);
  // 확대 수준 자체가 아니라 마커 크기만 상태로 둔다. 확대할 때마다 지도 전체를 다시 그리지 않고 크기 경계를 넘을 때만 다시 그린다.
  const [markerSize, setMarkerSize] = useState<MarkerSize>(getMarkerSize(DEFAULT_ZOOM));
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  // 핀을 눌러 카드를 열었을 때만 카드 제목으로 초점을 옮긴다. 주소(?place=)로 바로 열면 옮기지 않는다:
  // 아무 조작도 없는 상태의 초점은 전역 :focus-visible 테두리(globals.css)가 그대로 보여 제목에 진한 테두리가 남았다.
  const shouldFocusPanelRef = useRef(false);
  // 핀이 다 보이게 맞춘 핀 구성. 처음 열 때와 분야를 바꿀 때만 다시 맞추고, 장소를 고를 때는 맞추지 않는다.
  const fittedPinsKeyRef = useRef<string | null>(null);
  // 주소(?place=)로 바로 연 장소는 처음 한 번 그 장소로 확대해 간다. 이후에 고른 장소는 확대 수준을 두고 옮기기만 한다.
  const shouldZoomToSelectedRef = useRef(false);
  const reportedUnavailableRef = useRef(false);

  function handleSelectPin(pinId: string) {
    // 이미 고른 핀을 다시 누르면 아무것도 하지 않는다. 예전에는 GA map_place_selected가 한 번 더 갔다(2026-11-16 리뷰).
    if (pinId === selectedPin?.id) return;
    const pin = visiblePins.find((candidate) => candidate.id === pinId);
    if (!pin) return;
    shouldFocusPanelRef.current = true;
    openMapPlace({ category, placeId: pinId }, selectedPin !== null);
    trackAnalyticsEvent("map_place_selected", { map_category: category ?? "all", event_count: pin.events.length });
  }

  function handleClosePanel() {
    const closedPinId = selectedPin?.id;
    closeMapPlace(category);
    // 닫으면 연 핀으로 초점을 돌려준다(키보드 사용자가 지도에서 길을 잃지 않게).
    markerSlots.find((slot) => slot.pin.id === closedPinId)?.container.querySelector("button")?.focus({ preventScroll: true });
  }

  function handleSelectCategory(nextCategory: EventCategory | null) {
    if (nextCategory === category) return;
    const isPlaceStillVisible = selectedPin !== null && filterEventMapPlaces([selectedPin], nextCategory).length > 0;
    replaceMapQuery({ category: nextCategory, placeId: isPlaceStillVisible ? selectedPin.id : null });
    trackAnalyticsEvent("map_category_changed", { map_category: nextCategory ?? "all" });
  }

  // 지도를 볼 수 없게 되면 이유를 한 화면에 한 번만 보낸다. 운영에서 키·주소 등록이 빠지면 안내 문구만 보여 조용히 죽어 있기 때문이다.
  useEffect(() => {
    if (unavailableReason === null || reportedUnavailableRef.current) return;
    reportedUnavailableRef.current = true;
    trackAnalyticsEvent("map_unavailable", { reason: unavailableReason });
  }, [unavailableReason]);

  // 지도에 없는 장소(행사가 끝나 핀이 사라졌거나 고른 분야에 없는 장소)는 주소에서 뺀다. 남겨 두면 카드 없이 주소만 남았다(2026-11-16 리뷰).
  useEffect(() => {
    if (placeId !== null && selectedPin === null) replaceMapQuery({ category, placeId: null });
  }, [placeId, selectedPin, category]);

  // 등록하지 않은 주소에서 열었거나 키가 틀리면 지도 SDK가 알린다. 빈 지도 대신 안내를 보여 준다.
  useEffect(() => listenNaverMapsAuthFailure(() => setStatus("auth_failed")), []);

  // 핀 그리기. 모든 장소의 마커를 지도마다 한 번만 만들고, 분야를 바꾸면 아래 effect가 보이기만 바꾼다.
  // 예전에는 분야를 바꿀 때마다 마커를 모두 지우고 다시 만들어 포스터도 다시 그렸다. 핀이 30~50개로 늘 때를 대비했다(2026-11-16 사용자 요청).
  // 지도 SDK에는 빈 상자만 넘기고, 상자 안은 아래 createPortal로 React가 그린다.
  // 지도 만들기 effect보다 먼저 둔다: 화면을 떠날 때 정리(cleanup)가 선언 순서대로 돌아, 마커를 지도에서 뗀 뒤에 지도를 지우게 하려는 것이다.
  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    if (naverMaps === null || map === null || status !== "ready") return;

    const size = getMarkerSize(map.getZoom());
    const slots = pins.map((pin) => {
      const container = createMarkerContainer();
      const marker = new naverMaps.Marker({
        map,
        position: new naverMaps.LatLng(pin.latitude, pin.longitude),
        icon: createMarkerIcon(naverMaps, container, size),
        title: getPinLabel(pin),
        zIndex: 1,
      });
      return { pin, marker, container };
    });
    setMarkerSlots(slots);

    return () => {
      for (const { marker } of slots) marker.setMap(null);
      setMarkerSlots([]);
    };
  }, [status, pins]);

  // 고른 분야에 행사가 있는 장소만 보인다. 숨긴 마커는 아래 portal도 그리지 않아 키보드 초점도 가지 않는다.
  // 마우스를 올리면 보이는 이름(title)의 행사 수도 고른 분야 기준으로 맞춘다.
  useEffect(() => {
    const visiblePinById = new Map(visiblePins.map((pin) => [pin.id, pin]));
    for (const { pin, marker } of markerSlots) {
      const visiblePin = visiblePinById.get(pin.id);
      marker.setVisible(visiblePin !== undefined);
      if (visiblePin !== undefined) marker.setTitle(getPinLabel(visiblePin));
    }
  }, [visiblePins, markerSlots]);

  // 지도 만들기. SDK를 불러온 뒤 한 번만 만들고, 화면을 떠나면 지운다.
  useEffect(() => {
    const naverMaps = isSdkLoaded ? getNaverMaps() : null;
    const container = containerRef.current;
    if (naverMaps === null || container === null) return;

    const newMap = new naverMaps.Map(container, {
      center: new naverMaps.LatLng(MAP_DEFAULT_CENTER.latitude, MAP_DEFAULT_CENTER.longitude),
      zoom: DEFAULT_ZOOM,
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
    window.addEventListener("resize", handleResize);
    const zoomListener = naverMaps.Event.addListener(newMap, "zoom_changed", (zoom) => setMarkerSize(getMarkerSize(zoom)));
    return () => {
      window.removeEventListener("resize", handleResize);
      naverMaps.Event.removeListener(zoomListener);
      newMap.destroy();
      mapRef.current = null;
      fittedPinsKeyRef.current = null;
      // 지도를 다시 만들면(개발 모드 StrictMode의 다시 붙이기 등) ready로 다시 바뀌어 핀 effect가 새 지도에 핀을 그린다.
      setStatus((current) => (current === "ready" ? "loading" : current));
    };
  }, [isSdkLoaded]);

  // 확대 수준이 마커 크기 경계를 넘으면 이미 그린 마커의 상자 크기와 기준점을 바꾼다(마커를 다시 만들지 않는다).
  useEffect(() => {
    const naverMaps = getNaverMaps();
    if (naverMaps === null) return;
    for (const { marker, container } of markerSlots) marker.setIcon(createMarkerIcon(naverMaps, container, markerSize));
  }, [markerSize, markerSlots]);

  // 보이는 범위. 처음 열 때와 분야를 바꿀 때만 핀이 다 보이게 맞춘다. 주소에 장소가 있으면 처음에는 맞추지 않고
  // 아래 장소 effect가 그 장소로 확대해 간다(같은 때 두 번 옮기면 뒤의 이동이 앞의 확대를 끊을 수 있다).
  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    if (naverMaps === null || map === null || status !== "ready") return;

    const pinsKey = visiblePins.map((pin) => pin.id).join("|");
    if (fittedPinsKeyRef.current === pinsKey) return;
    const isFirstFit = fittedPinsKeyRef.current === null;
    fittedPinsKeyRef.current = pinsKey;

    if (isFirstFit && selectedPin !== null) shouldZoomToSelectedRef.current = true;
    else fitPins(naverMaps, map, visiblePins);
  }, [status, visiblePins, selectedPin]);

  // 겹친 마커의 쌓는 순서. 고른 마커가 맨 위이고, 나머지는 남쪽(화면 아래)에 있을수록 위에 둔다.
  // 마커는 꼬리 끝에서 위로 그려지므로, 아래 마커를 위에 쌓아야 위쪽 마커의 윗부분이 삐져나와 둘 다 보이고 눌린다.
  // 순서를 정하지 않았을 때는 국립산악박물관 포스터가 바로 남쪽의 속초시립박물관 포스터를 완전히 가렸다(2026-11-16).
  useEffect(() => {
    const northFirst = [...markerSlots].sort((a, b) => b.pin.latitude - a.pin.latitude);
    northFirst.forEach(({ pin, marker }, index) => {
      marker.setZIndex(pin.id === selectedPin?.id ? northFirst.length + 1 : index + 1);
    });
  }, [selectedPin, markerSlots]);

  // 고른 장소. 핀을 눌러 열었으면 카드 제목으로 초점을 옮기고, 고른 장소를 카드에 가리지 않는 곳의 가운데로 옮긴다.
  // 지도의 안쪽 여백(padding)을 카드 크기만큼 두면 지도 SDK가 그 나머지를 기준으로 가운데를 맞춘다.
  const selectedPinId = selectedPin?.id ?? null;
  const selectedLatitude = selectedPin?.latitude ?? null;
  const selectedLongitude = selectedPin?.longitude ?? null;
  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    const panel = panelRef.current;
    if (selectedPinId === null || selectedLatitude === null || selectedLongitude === null || panel === null) {
      map?.setOptions("padding", { top: 0, right: 0, bottom: 0, left: 0 });
      return;
    }
    if (shouldFocusPanelRef.current) {
      shouldFocusPanelRef.current = false;
      panelTitleRef.current?.focus({ preventScroll: true });
    }
    if (naverMaps === null || map === null || status !== "ready") return;

    const isSidePanel = window.matchMedia(SIDE_PANEL_MEDIA_QUERY).matches;
    map.setOptions("padding", isSidePanel
      ? { top: 0, right: 0, bottom: 0, left: panel.offsetLeft + panel.offsetWidth }
      : { top: 0, right: 0, bottom: panel.offsetHeight, left: 0 });
    const center = new naverMaps.LatLng(selectedLatitude, selectedLongitude);
    if (shouldZoomToSelectedRef.current) {
      shouldZoomToSelectedRef.current = false;
      map.morph(center, PLACE_ZOOM);
    } else {
      map.panTo(center);
    }
  }, [selectedPinId, selectedLatitude, selectedLongitude, status]);

  const selectedCategoryLabel = category === null ? null : categoryLabels[category];
  const visiblePinById = new Map(visiblePins.map((pin) => [pin.id, pin]));

  return (
    <div className="flex h-full flex-col">
      {clientId !== null && (
        <Script
          src={`${NAVER_MAPS_SCRIPT_URL}?ncpKeyId=${encodeURIComponent(clientId)}`}
          strategy="afterInteractive"
          onReady={() => setIsSdkLoaded(true)}
          onError={() => setStatus("script_error")}
        />
      )}

      <MapCategoryChips category={category} onSelect={handleSelectCategory} />

      <div className="relative min-h-0 flex-1 bg-surface-muted">
        {/* 지도 SDK가 지도 상자에 position: relative를 덮어써서, 자리는 바깥 상자가 잡고 지도는 그 안을 채운다. */}
        {/* isolate: 지도 SDK의 확대 버튼·로고가 쓰는 큰 z-index가 이 상자 안에서만 겹치게 해 장소 카드 위로 올라오지 않는다. */}
        <div className="absolute inset-0 isolate" aria-hidden={isMapUnavailable}>
          <div ref={containerRef} className="size-full" />
        </div>
        {markerSlots.map(({ pin, container }) => {
          const visiblePin = visiblePinById.get(pin.id);
          return visiblePin === undefined ? null : createPortal(
            <EventMapMarker pin={visiblePin} size={markerSize} isSelected={visiblePin.id === selectedPin?.id} onSelect={handleSelectPin} />,
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
            <Link href="/" className={getButtonClassName({ variant: "tonal" })}>행사 목록 보기</Link>
          </MapNotice>
        ) : status === "ready" && visiblePins.length === 0 ? (
          <MapNotice message={selectedCategoryLabel === null ? "지도에 표시할 행사가 없어요." : `지도에 표시할 ${selectedCategoryLabel} 일정이 없어요.`}>
            {selectedCategoryLabel === null ? (
              <Link href="/" className={getButtonClassName({ variant: "tonal" })}>행사 목록 보기</Link>
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

function MapNotice({ message, children }: { message: string; children: ReactNode }) {
  return (
    <div className="absolute inset-x-4 top-6 z-10 mx-auto flex max-w-sm flex-col items-center gap-3 rounded-card bg-surface p-5 text-center shadow-floating">
      <p className="text-body text-content-strong">{message}</p>
      {children}
    </div>
  );
}

function fitPins(naverMaps: NaverMapsApi, map: NaverMap, pins: readonly EventMapPin[]) {
  const [first, ...rest] = pins;
  if (first === undefined) {
    map.morph(new naverMaps.LatLng(MAP_DEFAULT_CENTER.latitude, MAP_DEFAULT_CENTER.longitude), DEFAULT_ZOOM);
    return;
  }
  if (rest.length === 0) {
    map.morph(new naverMaps.LatLng(first.latitude, first.longitude), PLACE_ZOOM);
    return;
  }
  const firstLatLng = new naverMaps.LatLng(first.latitude, first.longitude);
  const bounds = new naverMaps.LatLngBounds(firstLatLng, firstLatLng);
  for (const pin of rest) bounds.extend(new naverMaps.LatLng(pin.latitude, pin.longitude));
  map.fitBounds(bounds, { ...FIT_PINS_PADDING_PX, maxZoom: PLACE_ZOOM });
}
