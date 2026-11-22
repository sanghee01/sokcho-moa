"use client";

import { ChevronRight } from "lucide-react";
import { iconProps } from "@/components/ui/icon";
import { orderPinsForList, type MapPin } from "@/features/map/model/map-pins";
import { activityCategoryLabels } from "@/features/places/model/activity";
import { placeRegionLabels } from "@/features/places/model/region";

/**
 * md 이상 지도 왼쪽 판의 장소 목록(.ai/DESIGN.md 지도). 지금 레이어·분야에 맞는 핀을 글로 늘어놓고, 누르면 핀을 누른 것과 같이 장소 카드를 연다.
 * 가볼만한 곳은 속초 → 고성 → 양양 순서로 놓는다(orderPinsForList, 2026-11-22 사용자 요청).
 * 넓은 화면에서 지도만 보여 주면 핀 이름을 하나씩 찾아야 해서, 카카오맵·네이버 지도 PC처럼 왼쪽에 목록을 둔다(2026-11-21 사용자 결정: 시안 D).
 * 핀 버튼 이름("국립산악박물관, 행사 1개")과 겹치지 않게 이름과 설명을 쉼표 없이 따로 읽힌다.
 */
export function MapPinList({ pins, selectedId, onSelect }: { pins: readonly MapPin[]; selectedId: string | null; onSelect: (pinId: string) => void }) {
  if (pins.length === 0) return <p className="px-4 py-6 text-label font-normal text-content-muted">이 분야에는 지도에 올릴 곳이 없어요.</p>;
  return (
    <ul aria-label="지도에 보이는 곳" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {orderPinsForList(pins).map((pin) => {
        const isSelected = pin.id === selectedId;
        // 가볼만한 곳은 분류 옆에 지역을 붙인다. 지도는 지역으로 거르지 않아 속초·고성·양양이 섞여 보이기 때문이다(2026-11-22, 목록 줄과 같음).
        const description = pin.kind === "place"
          ? [activityCategoryLabels[pin.placeCategory], pin.region === null ? null : placeRegionLabels[pin.region]].filter(Boolean).join(" · ")
          : `행사 ${pin.events.length}개`;
        return (
          <li key={pin.id}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(pin.id)}
              className={`flex min-h-16 w-full items-center gap-3 border-b border-line px-4 py-3 text-left ${isSelected ? "bg-primary-subtle" : "hover:bg-surface-subtle"}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-content-strong">{pin.name ?? "이름 없는 장소"}</span>
                <span className="mt-0.5 block text-label font-normal text-content-muted">{description}</span>
              </span>
              <ChevronRight {...iconProps} size={18} className="shrink-0 text-content-subtle" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
