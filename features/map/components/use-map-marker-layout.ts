// 마커 배치 hook(map-view.tsx). 시내 전체를 볼 때 몸통이 겹치는 마커는 하나로 묶고, 남은 마커 중 다른 마커와 겹치지 않는 것만 장소 이름을 붙인다.
// 포스터 핀이 시내에 몰려 서로 가렸던 문제를 지도 서비스의 마커 묶기·겹침 관리 방식으로 푼다(2026-11-21 사용자 피드백).
import { useEffect, useState, type RefObject } from "react";
import { getPinLabel } from "@/features/map/components/map-marker-icon";
import { callNaverMapsSafely, getNaverMaps, type NaverMap } from "@/features/map/components/naver-maps";
import type { MarkerSlot } from "@/features/map/components/use-map-markers";
import type { MapStatus } from "@/features/map/components/use-naver-map";
import type { MapPin } from "@/features/map/model/map-pins";
import { clusterMapMarkers, MAP_MARKER_BODY_PX, selectMapLabelIds } from "@/features/map/model/map-label-layout";

/** 장소 이름 알약에서 이름 글자 말고 더해지는 폭: 안쪽 여백 4 + 개수 동그라미 36 + 간격 6 + 오른쪽 여백 12(event-map-marker.tsx의 p-1·size-9·gap-1.5·pr-3) */
const MAP_LABEL_EXTRA_PX = 58;
/** 장소 이름 글자의 최대 폭(event-map-marker.tsx의 max-w-36). 넘치면 말줄임한다. */
const MAP_LABEL_TEXT_MAX_PX = 144;
/**
 * 이 확대 수준까지만 겹치는 마커를 묶는다. 더 확대하면(17부터, 화면 44px이 약 40m) 장소가 모두 따로 보인다.
 * 묶음을 눌렀을 때 장소끼리 가까워(100m 안팎) 확대해도 계속 묶여 있으면 풀 방법이 없어서 상한을 둔다.
 */
const CLUSTER_MAX_ZOOM = 16;
/** 묶음을 누르면 묶인 장소가 다 보이게 확대하되, 이보다 더 들어가지 않는다. 묶기가 풀리는 확대 수준이다. */
export const CLUSTER_EXPAND_MAX_ZOOM = CLUSTER_MAX_ZOOM + 1;

/** 마커 배치 결과. 묶음(대표 → 묶인 장소들, 2곳 이상만), 묶여서 숨긴 마커, 장소 이름을 붙일 마커 */
export interface MarkerLayout {
  clusterMemberIds: ReadonlyMap<string, readonly string[]>;
  hiddenIds: ReadonlySet<string>;
  labeledIds: ReadonlySet<string>;
}

const EMPTY_MARKER_LAYOUT: MarkerLayout = { clusterMemberIds: new Map(), hiddenIds: new Set(), labeledIds: new Set() };

/**
 * 마커 배치를 계산하고 보일 마커만 보인다. 화면 위치는 지도 SDK의 좌표 변환으로 구한다. 묶여서 숨긴 마커도 위치를 알아야 확대했을 때 다시 풀 수 있어서다.
 * 지도 움직임이 끝날 때마다(mapIdleCount) 다시 계산한다. 마커끼리의 거리는 확대 수준이 바뀔 때만 달라진다.
 */
export function useMapMarkerLayout({
  mapRef,
  status,
  markerSlots,
  visiblePins,
  selectedPinId,
  mapIdleCount,
  containerRef,
}: {
  mapRef: RefObject<NaverMap | null>;
  status: MapStatus;
  markerSlots: readonly MarkerSlot[];
  visiblePins: readonly MapPin[];
  selectedPinId: string | null;
  mapIdleCount: number;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [markerLayout, setMarkerLayout] = useState<MarkerLayout>(EMPTY_MARKER_LAYOUT);

  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    if (naverMaps === null || map === null || status !== "ready") return;
    const frame = requestAnimationFrame(() => {
      const projection = map.getProjection();
      const points = visiblePins.map((pin) => {
        const offset = projection.fromCoordToOffset(new naverMaps.LatLng(pin.latitude, pin.longitude));
        return { id: pin.id, anchor: { x: offset.x, y: offset.y }, priority: pin.kind === "place" ? 1 : pin.events.length };
      });
      const clusters = map.getZoom() <= CLUSTER_MAX_ZOOM
        ? clusterMapMarkers(points, selectedPinId)
        : points.map((point) => ({ representativeId: point.id, memberIds: [point.id] }));

      const pinById = new Map(visiblePins.map((pin) => [pin.id, pin]));
      const pointById = new Map(points.map((point) => [point.id, point]));
      const measureLabelText = createLabelTextMeasurer(containerRef.current);
      // 묶음 대표도 이름 배치의 장애물로 넣되(이름이 묶음을 덮지 않게) 이름은 붙이지 않는다.
      const candidates = clusters.flatMap(({ representativeId, memberIds }) => {
        const point = pointById.get(representativeId);
        const name = pinById.get(representativeId)?.name ?? null;
        if (point === undefined) return [];
        const labelWidth = memberIds.length > 1 || name === null
          ? MAP_MARKER_BODY_PX
          : Math.min(measureLabelText(name), MAP_LABEL_TEXT_MAX_PX) + MAP_LABEL_EXTRA_PX;
        return [{ ...point, labelWidth }];
      });
      const clusterMemberIds = new Map(clusters
        .filter(({ memberIds }) => memberIds.length > 1)
        .map(({ representativeId, memberIds }) => [representativeId, memberIds]));
      const labeledIds = new Set([...selectMapLabelIds(candidates, selectedPinId)].filter((id) => !clusterMemberIds.has(id)));
      const hiddenIds = new Set(clusters.flatMap(({ memberIds }) => memberIds.slice(1)));
      const nextLayout: MarkerLayout = { clusterMemberIds, hiddenIds, labeledIds };
      setMarkerLayout((current) => (isSameMarkerLayout(current, nextLayout) ? current : nextLayout));
    });
    return () => cancelAnimationFrame(frame);
  }, [mapRef, status, markerSlots, visiblePins, selectedPinId, mapIdleCount, containerRef]);

  // 고른 분야에 행사가 있고 묶음에 들어가지 않은 장소만 보인다. 숨긴 마커는 화면의 portal도 그리지 않아 키보드 초점도 가지 않는다.
  // 마우스를 올리면 보이는 이름(title)의 행사 수도 고른 분야 기준으로 맞춘다.
  useEffect(() => {
    const visiblePinById = new Map(visiblePins.map((pin) => [pin.id, pin]));
    // 인증 실패 알림보다 먼저 분야를 바꾸면 깨진 SDK 마커를 건드릴 수 있어 감싼다(naver-maps.ts의 callNaverMapsSafely, 2026-11-21 리뷰).
    callNaverMapsSafely(() => {
      for (const { pin, marker } of markerSlots) {
        const visiblePin = visiblePinById.get(pin.id);
        marker.setVisible(visiblePin !== undefined && !markerLayout.hiddenIds.has(pin.id));
        if (visiblePin !== undefined) marker.setTitle(getPinLabel(visiblePin));
      }
    });
  }, [visiblePins, markerSlots, markerLayout]);

  return markerLayout;
}

/**
 * 장소 이름 글자 폭을 재는 함수. 이름을 실제로 그리기 전에 겹침을 따져야 해서 canvas로 잰다.
 * 글꼴은 마커의 개수 글자(이름과 같은 caption·semibold)에서 읽는다. 마커가 아직 없으면 글자 수로 어림한다.
 */
function createLabelTextMeasurer(sample: HTMLElement | null) {
  const countElement = sample?.querySelector<HTMLElement>("[data-map-marker-count]");
  const context = document.createElement("canvas").getContext("2d");
  if (!countElement || context === null) return (text: string) => text.length * 13;
  const style = getComputedStyle(countElement);
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return (text: string) => Math.ceil(context.measureText(text).width);
}

function isSameIdSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

function isSameMarkerLayout(a: MarkerLayout, b: MarkerLayout) {
  return isSameIdSet(a.hiddenIds, b.hiddenIds)
    && isSameIdSet(a.labeledIds, b.labeledIds)
    && a.clusterMemberIds.size === b.clusterMemberIds.size
    && [...a.clusterMemberIds].every(([id, members]) => b.clusterMemberIds.get(id)?.join("|") === members.join("|"));
}
