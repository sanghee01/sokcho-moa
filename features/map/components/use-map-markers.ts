// 지도 SDK 마커를 만들고 쌓는 순서를 정하는 hook(map-view.tsx). 마커 상자 안의 내용은 화면이 createPortal로 그린다.
import { useEffect, useState, type RefObject } from "react";
import { createMarkerContainer, createMarkerIcon, getPinLabel } from "@/features/map/components/map-marker-icon";
import { callNaverMapsSafely, getNaverMaps, type NaverMap, type NaverMarker } from "@/features/map/components/naver-maps";
import type { MapStatus } from "@/features/map/components/use-naver-map";
import type { MapPin } from "@/features/map/model/map-pins";

/** 지도에 올린 핀 하나. 지도 SDK 마커와 그 마커 상자(안의 내용은 React가 portal로 그린다)를 함께 둔다. pin은 분야로 거르기 전 장소다. */
export interface MarkerSlot {
  pin: MapPin;
  marker: NaverMarker;
  container: HTMLDivElement;
}

/**
 * 모든 장소의 마커를 지도마다 한 번만 만든다. 분야를 바꾸면 마커 배치 hook(use-map-marker-layout.ts)이 보이기만 바꾼다.
 * 예전에는 분야를 바꿀 때마다 마커를 모두 지우고 다시 만들어 포스터도 다시 그렸다. 핀이 30~50개로 늘 때를 대비했다(2026-11-16 사용자 요청).
 * 지도 SDK에는 빈 상자만 넘긴다. 이 hook은 지도 만들기(use-naver-map.ts)보다 먼저 불러, 화면을 떠날 때 마커를 뗀 뒤 지도를 지우게 한다.
 */
export function useMapMarkers({
  mapRef,
  status,
  allPins,
  selectedPinId,
}: {
  mapRef: RefObject<NaverMap | null>;
  status: MapStatus;
  allPins: readonly MapPin[];
  selectedPinId: string | null;
}) {
  const [markerSlots, setMarkerSlots] = useState<MarkerSlot[]>([]);

  useEffect(() => {
    const naverMaps = getNaverMaps();
    const map = mapRef.current;
    if (naverMaps === null || map === null || status !== "ready") return;

    // 만드는 도중 SDK가 깨지면(인증 실패) 만든 데까지만 정리하고 그리지 않는다. 안내 화면은 인증 실패 알림이 띄운다.
    const slots: MarkerSlot[] = [];
    const isCreated = callNaverMapsSafely(() => {
      for (const pin of allPins) {
        const container = createMarkerContainer();
        const marker = new naverMaps.Marker({
          map,
          position: new naverMaps.LatLng(pin.latitude, pin.longitude),
          icon: createMarkerIcon(naverMaps, container),
          title: getPinLabel(pin),
          zIndex: 1,
        });
        slots.push({ pin, marker, container });
      }
    });
    if (isCreated) setMarkerSlots(slots);

    return () => {
      for (const { marker } of slots) callNaverMapsSafely(() => marker.setMap(null));
      setMarkerSlots([]);
    };
  }, [mapRef, status, allPins]);

  // 겹친 마커의 쌓는 순서. 고른 마커가 맨 위이고, 나머지는 남쪽(화면 아래)에 있을수록 위에 둔다.
  // 마커는 꼬리 끝에서 위로 그려지므로, 아래 마커를 위에 쌓아야 위쪽 마커의 윗부분이 삐져나와 둘 다 보이고 눌린다.
  // 순서를 정하지 않았을 때는 국립산악박물관 포스터가 바로 남쪽의 속초시립박물관 포스터를 완전히 가렸다(2026-11-16).
  useEffect(() => {
    const northFirst = [...markerSlots].sort((a, b) => b.pin.latitude - a.pin.latitude);
    callNaverMapsSafely(() => {
      northFirst.forEach(({ pin, marker }, index) => {
        marker.setZIndex(pin.id === selectedPinId ? northFirst.length + 1 : index + 1);
      });
    });
  }, [selectedPinId, markerSlots]);

  return markerSlots;
}
