"use client";

import { mapLayers, type MapLayer } from "@/features/events/model/event-map";
import { categoryLabels, eventCategories } from "@/features/events/model/taxonomy";
import { activityCategories, activityCategoryLabels } from "@/features/places/model/activity";

const layerLabels: Record<MapLayer, string> = { events: "행사", places: "가볼만한 곳" };

/**
 * 지도 위 레이어 전환(행사 | 가볼만한 곳)과 그 레이어의 분야 칩(.ai/DESIGN.md 지도). 다른 페이지로 가지 않고 지도 안에서 거른다.
 * 행사 분야는 7칸이 한 줄에 들어가고, 가볼만한 곳 분류는 이름이 길어 지도 서비스처럼 가로로 밀어 본다(카카오맵·구글 지도 칩).
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
      <div role="group" aria-label="지도 레이어" className="grid grid-cols-2 gap-1 px-3 pt-2 sm:mx-auto sm:max-w-sm">
        {mapLayers.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === layer}
            onClick={() => onSelectLayer(item)}
            className={`inline-flex min-h-11 items-center justify-center rounded-control text-label ${item === layer ? "bg-content-strong font-semibold text-on-primary" : "bg-surface-muted text-content-muted hover:text-content-strong"}`}
          >
            {layerLabels[item]}
          </button>
        ))}
      </div>
      <div role="group" aria-label="지도 분야" className={layer === "events" ? "grid grid-cols-7 px-1 py-1 sm:flex sm:justify-center sm:gap-1 sm:px-4" : "flex gap-1 overflow-x-auto px-2 py-1 sm:justify-center"}>
        {items.map((item) => {
          const isActive = item.value === category;
          return (
            <button
              key={item.value ?? "all"}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectCategory(item.value)}
              className="group inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap"
            >
              <span className={`rounded-control px-2.5 py-1.5 text-label sm:px-4 ${isActive
                ? "bg-primary font-semibold text-on-primary"
                : "text-content-muted group-hover:bg-surface-muted group-hover:text-content"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
