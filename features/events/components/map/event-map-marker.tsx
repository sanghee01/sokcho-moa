"use client";

import { MapPin } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import { getPinLabel } from "@/features/events/components/map/map-marker-icon";
import type { PlaceMapPin, VenueMapPin } from "@/features/events/model/event-map";

/**
 * 지도 마커 하나(.ai/DESIGN.md 지도). 행사 개수 동그라미(몸통) + 아래 꼬리와 위치 점이고, 자리가 있으면 몸통 옆에 장소 이름을 붙여 알약이 된다.
 * - 예전에는 맨 앞 행사의 포스터 액자를 마커로 썼지만 시내에 시설이 몰려 포스터끼리 가려 읽고 누르기 어려웠다.
 *   포스터는 장소를 눌러 여는 카드에서 보이고, 지도에는 위치·개수·이름만 둔다(2026-11-21 사용자 결정).
 * - 장소 이름을 보일지는 event-map.tsx가 다른 마커와 겹치는지 따져 정한다(model/map-label-layout.ts). 고른 장소는 늘 보인다.
 * - 버튼이라 키보드로도 고를 수 있다.
 */
export function EventMapMarker({
  pin,
  isLabelShown,
  isSelected,
  onSelect,
}: {
  pin: VenueMapPin;
  isLabelShown: boolean;
  isSelected: boolean;
  onSelect: (pinId: string) => void;
}) {
  const shouldShowName = pin.name !== null && (isLabelShown || isSelected);

  return (
    <button
      type="button"
      aria-label={getPinLabel(pin)}
      aria-pressed={isSelected}
      data-map-marker
      onClick={() => onSelect(pin.id)}
      // 누름은 보이는 몸통(알약)으로만 받는다(pointer-events: 버튼은 none, 몸통만 auto). 버튼 상자가 보이는 모양보다 넓으면
      // 고른 마커가 맨 위로 올라올 때 투명한 영역이 옆 마커의 누름을 가로챘다(2026-11-16 사용자 피드백).
      // 몸통을 누르면 click이 버튼까지 올라와 onClick이 불리고, 키보드 초점·Enter는 그대로 버튼이 받는다.
      className="group pointer-events-none flex w-max shrink-0 flex-col items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* 몸통 높이(h-11)와 이름 알약의 안쪽 여백(p-1, size-9, gap-1.5, pr-3)은 이름 배치 계산의 폭(MAP_LABEL_EXTRA_PX, event-map.tsx)·높이(MAP_MARKER_BODY_PX)와 맞춘다. */}
      <span
        className={`pointer-events-auto relative z-10 flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface p-1 shadow-floating ring-1 ring-line group-aria-pressed:bg-primary group-aria-pressed:ring-primary ${shouldShowName ? "pr-3" : ""}`}
      >
        <span
          aria-hidden="true"
          data-map-marker-count
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold tabular-nums text-on-primary group-aria-pressed:bg-surface group-aria-pressed:text-primary-text"
        >
          {pin.events.length}
        </span>
        {Boolean(shouldShowName) && (
          // 긴 시설 이름("속초농협 하나로마트 엑스포점")은 한 줄에서 말줄임한다. 전체 이름은 버튼 이름과 장소 카드 제목에 있다.
          <span aria-hidden="true" className="max-w-36 truncate text-caption font-semibold text-content-strong group-aria-pressed:text-on-primary">
            {pin.name}
          </span>
        )}
      </span>
      {/* 말풍선 꼬리: 몸통 뒤에 45도 돌린 정사각형을 두어 아래 절반만 삼각형으로 보이게 한다.
          크기·겹침(size-3, -mt-2)을 바꾸면 기준점(MAP_MARKER_TAIL_TIP_PX)도 함께 바꾼다. */}
      <span aria-hidden="true" className="-mt-2 size-3 shrink-0 rotate-45 bg-surface shadow-floating group-aria-pressed:bg-primary" />
      {/* 위치 점: 꼬리 끝에 찍어 정확한 장소를 보인다. 점의 가운데가 장소 좌표다(2026-11-16 사용자 요청). */}
      <span aria-hidden="true" className="relative z-10 -mt-1 size-2.5 shrink-0 rounded-full bg-primary ring-2 ring-surface" />
    </button>
  );
}

/**
 * 몸통이 겹치는 장소 여러 곳을 묶은 마커(.ai/DESIGN.md 지도). 묶인 장소들의 행사 수 합계를 보이고, 누르면 그 장소들이 다 보이게 확대해 풀린다.
 * 한 장소 마커(흰 몸통 + 개수 동그라미)와 구별되게 채운 동그라미 + 옅은 테두리이고, 여러 곳이라 위치 점과 꼬리는 두지 않는다.
 */
export function EventMapClusterMarker({ placeCount, eventCount, onExpand }: { placeCount: number; eventCount: number | null; onExpand: () => void }) {
  // "가볼만한 곳" 레이어에서는 행사 수가 없어(null) 장소 수를 보인다.
  return (
    <button
      type="button"
      aria-label={eventCount === null ? `장소 ${placeCount}곳, 눌러서 확대` : `장소 ${placeCount}곳, 행사 ${eventCount}개, 눌러서 확대`}
      data-map-marker
      onClick={onExpand}
      className="pointer-events-none flex w-max shrink-0 flex-col items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span
        aria-hidden="true"
        className="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-body font-bold tabular-nums text-on-primary shadow-floating ring-4 ring-primary/25"
      >
        {eventCount ?? placeCount}
      </span>
    </button>
  );
}

/**
 * "가볼만한 곳" 장소 마커(.ai/DESIGN.md 지도). 행사 마커와 같은 몸통·꼬리·위치 점 구조이고, 개수 동그라미 대신 핀 아이콘을 둔다.
 * 한 번에 한 레이어만 보이므로 모양만 달리하고 범례는 두지 않는다(2026-11-21).
 */
export function PlaceMapMarker({
  pin,
  isLabelShown,
  isSelected,
  onSelect,
}: {
  pin: PlaceMapPin;
  isLabelShown: boolean;
  isSelected: boolean;
  onSelect: (pinId: string) => void;
}) {
  const shouldShowName = isLabelShown || isSelected;
  return (
    <button
      type="button"
      aria-label={getPinLabel(pin)}
      aria-pressed={isSelected}
      data-map-marker
      onClick={() => onSelect(pin.id)}
      className="group pointer-events-none flex w-max shrink-0 flex-col items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span
        className={`pointer-events-auto relative z-10 flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface p-1 shadow-floating ring-1 ring-line group-aria-pressed:bg-accent group-aria-pressed:ring-accent ${shouldShowName ? "pr-3" : ""}`}
      >
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-primary group-aria-pressed:bg-surface group-aria-pressed:text-content-strong">
          <MapPin {...iconProps} size={18} />
        </span>
        {Boolean(shouldShowName) && (
          <span aria-hidden="true" className="max-w-36 truncate text-caption font-semibold text-content-strong group-aria-pressed:text-on-primary">
            {pin.name}
          </span>
        )}
      </span>
      <span aria-hidden="true" className="-mt-2 size-3 shrink-0 rotate-45 bg-surface shadow-floating group-aria-pressed:bg-accent" />
      <span aria-hidden="true" className="relative z-10 -mt-1 size-2.5 shrink-0 rounded-full bg-accent ring-2 ring-surface" />
    </button>
  );
}
