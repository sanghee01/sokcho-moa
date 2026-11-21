// 지도 SDK에 넘기는 마커 상자(.ai/DESIGN.md 지도). 마커 모양은 event-map-marker.tsx가 그린다.
// 크기 숫자는 model/map-label-layout.ts 한 곳에 두고, 이름 배치 계산과 마커 상자가 같은 숫자를 쓴다(Tailwind class와 숫자가 따로 놀지 않게, 2026-11-16 리뷰).
import type { NaverMapsApi } from "@/features/events/components/map/naver-maps";
import { MAP_MARKER_BODY_PX, MAP_MARKER_TAIL_TIP_PX } from "@/features/events/model/map-label-layout";
import type { EventMapPin } from "@/features/events/model/event-map";

/** 핀이 다 보이게 맞출 때 지도 가장자리에 두는 여백. 위쪽은 마커 몸통(44) + 꼬리(5)가, 양옆은 장소 이름 알약이 잘리지 않게 띄운다. */
export const FIT_PINS_PADDING_PX = { top: 72, right: 72, bottom: 48, left: 72 } as const;

/** 핀 버튼의 접근성 이름. 지도 SDK 마커의 title(마우스를 올리면 보이는 이름)에도 같은 값을 쓴다. */
export function getPinLabel(pin: Pick<EventMapPin, "name" | "events">) {
  return `${pin.name ?? "장소 이름 없음"}, 행사 ${pin.events.length}개`;
}

/**
 * 지도 SDK에 넘기는 빈 마커 상자. 안의 버튼·개수·위치 점은 React가 portal로 그린다.
 * 상자는 몸통(개수 동그라미) 폭이고, 장소 이름을 붙인 알약은 상자 양옆으로 넘친다. 가운데 정렬(flex)이라 알약도 기준점 가운데에 온다.
 */
export function createMarkerContainer() {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.justifyContent = "center";
  // 버튼 높이를 상자에 맞춰 늘리지 않는다. 늘리면 상자보다 긴 내용이 납작하게 눌렸다.
  container.style.alignItems = "flex-start";
  return container;
}

/**
 * 마커 상자의 크기와 기준점(꼬리 끝 위치 점의 가운데). 상자 크기도 여기서 맞춰 지도 SDK가 아는 크기와 실제 크기가 같게 한다.
 * 상자는 몸통 + 꼬리만큼이다. 이름 알약 자리까지 잡으면 SDK가 만든 투명한 바깥 상자가 옆 마커의 누름을 가로챘다(2026-11-16 사용자 피드백).
 */
export function createMarkerIcon(naverMaps: NaverMapsApi, container: HTMLDivElement) {
  const width = MAP_MARKER_BODY_PX;
  const height = MAP_MARKER_BODY_PX + MAP_MARKER_TAIL_TIP_PX;
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  return {
    content: container,
    size: new naverMaps.Size(width, height),
    anchor: new naverMaps.Point(width / 2, height),
  };
}
