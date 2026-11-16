"use client";

import { categoryLabels, eventCategories, type EventCategory } from "@/features/events/model/taxonomy";

/** 지도 위 분야 칩. 헤더의 분야 탭과 같은 알약 모양 7칸이지만 다른 페이지로 가지 않고 지도 안에서 거른다(.ai/DESIGN.md 지도). */
export function MapCategoryChips({
  category,
  onSelect,
}: {
  category: EventCategory | null;
  onSelect: (category: EventCategory | null) => void;
}) {
  return (
    <div role="group" aria-label="지도 분야" className="grid shrink-0 grid-cols-7 border-b border-line bg-surface px-1 py-1 sm:flex sm:justify-center sm:gap-1 sm:px-4">
      {[null, ...eventCategories].map((item) => {
        const isActive = item === category;
        return (
          <button
            key={item ?? "all"}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(item)}
            className="group inline-flex min-h-11 items-center justify-center whitespace-nowrap"
          >
            <span className={`rounded-control px-2.5 py-1.5 text-label sm:px-4 ${isActive
              ? "bg-primary font-semibold text-on-primary"
              : "text-content-muted group-hover:bg-surface-muted group-hover:text-content"}`}>
              {item === null ? "전체" : categoryLabels[item]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
