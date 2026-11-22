"use client";

import { getFilterChipClassName } from "@/components/ui/filter-chip-styles";
import { mapLayers, type MapLayer } from "@/features/map/model/map-pins";
import { categoryLabels, eventCategories } from "@/features/events/model/taxonomy";
import { activityCategories, activityCategoryLabels } from "@/features/places/model/activity";

const layerLabels: Record<MapLayer, string> = { events: "행사", places: "가볼만한 곳" };

/**
 * 지도의 레이어 전환(행사 | 가볼만한 곳)과 그 레이어의 분야 칩(.ai/DESIGN.md 지도). 다른 페이지로 가지 않고 지도 안에서 거른다.
 * 전환은 밑줄 탭이다. 진한 두 칸 버튼은 실행 버튼처럼 무거워 보였고, 밑줄 탭은 "보는 종류를 바꾼다"로 읽힌다(2026-11-21 사용자 결정: 시안 B).
 * 모바일은 지도 위 전체 폭, md 이상은 왼쪽 목록 판 맨 위에 있어 레이어를 바꿔도 자리가 움직이지 않는다(시안 D, event-map.tsx).
 * 칩 사이 간격은 두 레이어가 같다: 모바일은 칸 안쪽 여백 2px씩(보이는 간격 4px), md 이상은 8px(2026-11-21 사용자 피드백).
 */
export function MapCategoryChips({
  layer,
  category,
  onSelectLayer,
  onSelectCategory,
}: {
  layer: MapLayer;
  category: string | null;
  onSelectLayer: (layer: MapLayer) => void;
  onSelectCategory: (category: string | null) => void;
}) {
  const items = layer === "events"
    ? [null, ...eventCategories].map((item) => ({ value: item, label: item === null ? "전체" : categoryLabels[item] }))
    : [null, ...activityCategories].map((item) => ({ value: item, label: item === null ? "전체" : activityCategoryLabels[item] }));
  return (
    <div className="shrink-0 border-b border-line bg-surface">
      <div role="group" aria-label="지도 레이어" className="grid grid-cols-2 border-b border-line">
        {mapLayers.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === layer}
            onClick={() => onSelectLayer(item)}
            className={`-mb-px inline-flex min-h-12 items-center justify-center border-b-2 text-body ${item === layer ? "border-primary font-semibold text-content-strong" : "border-transparent text-content-muted hover:text-content-strong"}`}
          >
            {layerLabels[item]}
          </button>
        ))}
      </div>
      <div
        role="group"
        aria-label="지도 분야"
        className={`px-1.5 py-1 md:flex md:flex-wrap md:gap-x-2 md:overflow-visible md:px-4 md:py-2 ${layer === "events" ? "grid grid-cols-7" : "flex overflow-x-auto"}`}
      >
        {items.map((item) => {
          const isActive = item.value === category;
          return (
            <button
              key={item.value ?? "all"}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectCategory(item.value)}
              className="group inline-flex min-h-11 shrink-0 items-center justify-center px-0.5 md:px-0"
            >
              <span className={getFilterChipClassName(isActive, layer === "events" ? "fill" : "fit")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
