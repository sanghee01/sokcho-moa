// 지도 마커의 크기와 지도 SDK에 넘기는 마커 상자(.ai/DESIGN.md 지도). 마커 모양은 event-map-marker.tsx가 그린다.
// 크기 숫자는 이 파일 한 곳에 두고, 마커 컴포넌트는 액자 크기를 여기서 읽는다(Tailwind class와 숫자가 따로 놀지 않게, 2026-11-16 리뷰).
import type { NaverMapsApi } from "@/features/events/components/map/naver-maps";
import type { EventMapPin } from "@/features/events/model/event-map";

export type MarkerSize = "compact" | "large";

/**
 * 이만큼 확대하면 마커를 크게(포스터 72×90) 그리고 장소 이름을 보인다. 그보다 줄여 본 시내 전체(13 안팎)에서는
 * 시설이 몰려 있어 작은 포스터(48×60)만 두고 이름을 숨긴다. 고른 장소의 이름은 늘 보인다.
 * 마커가 한 크기이면 확대할수록 지도에 비해 포스터가 작아 보였다(2026-11-16 사용자 피드백).
 */
const LARGE_MARKER_MIN_ZOOM = 14;

/** 포스터 액자(흰 테두리 포함) 크기 */
export const MARKER_FRAME_PX = { compact: { width: 48, height: 60 }, large: { width: 72, height: 90 } } as const;

/**
 * 액자 바닥에서 위치 점 가운데(기준점)까지. 마커 컴포넌트의 꼬리·점 class와 맞춘 값이다: 꼬리는 12px 정사각형(size-3)을 45도 돌린 것이고
 * 액자 바닥보다 8px 위(-mt-2)에서 시작해 상자 바닥이 액자 바닥 아래 4px이다. 점(size-2.5)은 거기서 4px 올라가(-mt-1) 가운데가 액자 바닥 아래 5px이다.
 */
const MARKER_TAIL_TIP_PX = 5;

/** 핀이 다 보이게 맞출 때 지도 가장자리에 두는 여백. 위쪽은 큰 마커(액자 90 + 꼬리 5)와 개수 배지(위로 10px)가 잘리지 않게 더 띄운다. */
export const FIT_PINS_PADDING_PX = { top: 112, right: 48, bottom: 48, left: 48 } as const;

export function getMarkerSize(zoom: number): MarkerSize {
  return zoom >= LARGE_MARKER_MIN_ZOOM ? "large" : "compact";
}

/** 핀 버튼의 접근성 이름. 지도 SDK 마커의 title(마우스를 올리면 보이는 이름)에도 같은 값을 쓴다. */
export function getPinLabel(pin: Pick<EventMapPin, "name" | "events">) {
  return `${pin.name ?? "장소 이름 없음"}, 행사 ${pin.events.length}개`;
}

/**
 * 지도 SDK에 넘기는 빈 마커 상자. 안의 버튼·포스터·위치 점은 React가 portal로 그린다.
 * 상자는 액자 크기이고 장소 이름은 상자 밖으로 넘친다. 가운데 정렬(flex)이라 넘친 이름도 액자 가운데 아래에 온다.
 */
export function createMarkerContainer() {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.justifyContent = "center";
  // 버튼 높이를 상자에 맞춰 늘리지 않는다. 늘리면 상자보다 긴 내용(장소 이름)이 납작하게 눌렸다.
  container.style.alignItems = "flex-start";
  return container;
}

/**
 * 마커 상자의 크기와 기준점(꼬리 끝 위치 점의 가운데). 상자 크기도 여기서 맞춰 지도 SDK가 아는 크기와 실제 크기가 같게 한다.
 * 상자는 액자 + 꼬리만큼이다. 장소 이름 자리까지 잡으면 SDK가 만든 투명한 바깥 상자가 옆에 겹친 포스터의 누름을 가로챘다(2026-11-16 사용자 피드백).
 * 위치 점의 아래 절반은 상자 밖으로 나오지만 누름 영역이 아니라 괜찮다.
 */
export function createMarkerIcon(naverMaps: NaverMapsApi, container: HTMLDivElement, size: MarkerSize) {
  const { width, height: frameHeight } = MARKER_FRAME_PX[size];
  const height = frameHeight + MARKER_TAIL_TIP_PX;
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  return {
    content: container,
    size: new naverMaps.Size(width, height),
    anchor: new naverMaps.Point(width / 2, height),
  };
}
