"use client";

import Image from "next/image";
import { useState } from "react";
import { DEFAULT_EVENT_POSTER_PATH } from "@/features/events/components/event-image-placeholder";
import { getPinLabel, MARKER_FRAME_PX, type MarkerSize } from "@/features/events/components/map/map-marker-icon";
import { getEventImageThumbnailUrl } from "@/features/events/model/event-image-thumbnail";
import type { EventMapPin } from "@/features/events/model/event-map";

/**
 * 지도 마커 하나(.ai/DESIGN.md 지도). 포스터 액자와 꼬리가 한 덩어리인 말풍선 + 꼬리 아래 장소 이름이다.
 * - 지도 핀 아이콘·동그란 점·막대를 따로 붙여 봤지만 포스터와 따로 놀아 보여 말풍선으로 정했다.
 *   장소 이름은 당근 동네지도처럼 마커 아래에 붙여 자리를 알린다(2026-11-16 사용자 결정).
 * - 포스터는 맨 앞 행사(신청 마감이 가장 가까운 행사)의 것이고, 행사가 둘 이상이면 오른쪽 위에 개수를 붙인다.
 * - 확대했을 때(large)는 포스터를 키우고 장소 이름을 보인다. 고른 장소는 액자를 바다색으로 바꾸고 이름을 늘 보인다.
 * - 버튼이라 키보드로도 고를 수 있다.
 */
export function EventMapMarker({
  pin,
  size,
  isSelected,
  onSelect,
}: {
  pin: EventMapPin;
  size: MarkerSize;
  isSelected: boolean;
  onSelect: (pinId: string) => void;
}) {
  const originalSrc = pin.events[0]?.imageUrl?.trim() || DEFAULT_EVENT_POSTER_PATH;
  // 썸네일(업로드 때 만든 240px) → 원본 → 기본 포스터 순으로, 불러오지 못한 주소를 건너뛴다.
  // 썸네일이 생기기 전에 올린 포스터와 외부 주소 포스터는 썸네일이 없어 원본으로 대신 보인다(2026-11-16).
  const posterSources = [getEventImageThumbnailUrl(originalSrc), originalSrc, DEFAULT_EVENT_POSTER_PATH];
  const [failedSrcs, setFailedSrcs] = useState<string[]>([]);
  const posterSrc = posterSources.find((source) => source !== null && !failedSrcs.includes(source)) ?? DEFAULT_EVENT_POSTER_PATH;
  const isLabelShown = pin.name !== null && (size === "large" || isSelected);

  return (
    <button
      type="button"
      aria-label={getPinLabel(pin)}
      aria-pressed={isSelected}
      onClick={() => onSelect(pin.id)}
      // 누름은 포스터 액자로만 받는다(pointer-events: 버튼은 none, 액자만 auto). 버튼 상자는 아래 장소 이름 폭(최대 144px)만큼 넓어서,
      // 고른 마커가 맨 위로 올라오면 포스터 옆의 투명한 버튼 영역이 옆 포스터의 누름을 가로챘다(2026-11-16 사용자 피드백).
      // 액자를 누르면 click이 버튼까지 올라와 onClick이 불리고, 키보드 초점·Enter는 그대로 버튼이 받는다.
      className="group pointer-events-none flex w-max shrink-0 flex-col items-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* 액자 크기는 지도 SDK에 알려 주는 마커 상자 크기와 같은 숫자(MARKER_FRAME_PX)에서 읽는다. */}
      <span
        style={MARKER_FRAME_PX[size]}
        className="pointer-events-auto relative z-10 block shrink-0 rounded-control bg-surface p-0.5 shadow-floating group-aria-pressed:bg-primary"
      >
        <span className="relative block size-full overflow-hidden rounded-badge bg-surface-muted">
          {/* 핀은 48~72px이라 원본(최대 1600px) 대신 썸네일을 쓴다. 썸네일은 이미 작아 Next 이미지 최적화를 거치지 않는다.
              지도 SDK가 옮겨 다니는 상자 안에서는 지연 로딩이 늦게 걸려 빈 액자로 보였다. 핀은 수십 개라 바로 불러온다. */}
          <Image
            src={posterSrc}
            alt=""
            fill
            unoptimized
            loading="eager"
            sizes={`${MARKER_FRAME_PX.large.width}px`}
            onError={() => setFailedSrcs((current) => [...current, posterSrc])}
            className="object-cover object-top"
          />
        </span>
        {pin.events.length > 1 && (
          <span aria-hidden="true" className="absolute -right-2.5 -top-2.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-caption font-semibold tabular-nums text-on-primary ring-2 ring-surface">
            {pin.events.length}
          </span>
        )}
      </span>
      {/* 말풍선 꼬리: 액자 뒤에 45도 돌린 정사각형을 두어 아래 절반만 삼각형으로 보이게 한다.
          크기·겹침(size-3, -mt-2)을 바꾸면 map-marker-icon.ts의 기준점(MARKER_TAIL_TIP_PX)도 함께 바꾼다. */}
      <span aria-hidden="true" className="-mt-2 size-3 shrink-0 rotate-45 bg-surface shadow-floating group-aria-pressed:bg-primary" />
      {/* 위치 점: 꼬리 끝에 찍어 정확한 장소를 보인다. 점의 가운데가 장소 좌표다(2026-11-16 사용자 요청). */}
      <span aria-hidden="true" className="relative z-10 -mt-1 size-2.5 shrink-0 rounded-full bg-primary ring-2 ring-surface" />
      {Boolean(isLabelShown) && (
        // 긴 시설 이름("속초농협 하나로마트 엑스포점")이 한 줄에서 잘려 두 줄까지 보인다. 글자는 13px보다 줄이지 않는다(.ai/DESIGN.md).
        <span aria-hidden="true" className="mt-1 line-clamp-2 max-w-36 shrink-0 rounded-badge bg-surface/90 px-1.5 py-0.5 text-center text-caption font-semibold text-content-strong">
          {pin.name}
        </span>
      )}
    </button>
  );
}
