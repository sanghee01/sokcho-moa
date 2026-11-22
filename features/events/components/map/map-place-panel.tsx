"use client";

import { X } from "lucide-react";
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { iconProps } from "@/components/ui/icon";
import type { MapPin } from "@/features/events/model/event-map";

/**
 * 장소 카드(.ai/DESIGN.md 지도). 모바일은 지도 아래쪽 시트(최대 60%), md 이상은 왼쪽 24rem 떠 있는 판이다.
 * 모달이 아니라 지도는 계속 움직일 수 있다. 내용은 서버가 그린 목록과 같은 EventCard이고, 카드를 누르면 상세로 간다.
 */
export function MapPlacePanel({
  pin,
  cards,
  ref,
  titleRef,
  onClose,
}: {
  pin: MapPin;
  /** 행사 slug → 서버가 그린 행사 카드 */
  cards: Record<string, ReactNode>;
  ref: Ref<HTMLElement>;
  titleRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
}) {
  // 카드 안에 초점이 있을 때 Esc로 닫는다. 모달이 아니라 화면 전체의 Esc는 가로채지 않는다(2026-11-16 리뷰).
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onClose();
  }

  return (
    <section
      ref={ref}
      aria-labelledby="map-place-title"
      onKeyDown={handleKeyDown}
      className="absolute inset-x-0 bottom-0 z-10 flex max-h-3/5 flex-col rounded-t-card bg-surface pb-[env(safe-area-inset-bottom)] shadow-floating md:inset-y-4 md:left-4 md:right-auto md:max-h-none md:w-96 md:rounded-card md:pb-0"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line py-1 pl-4 pr-1">
        <h2 id="map-place-title" ref={titleRef} tabIndex={-1} className="min-w-0 truncate text-title-3 text-content-strong focus:outline-none">
          {pin.kind === "place" ? "가볼만한 곳" : pin.name ?? "이 장소의 행사"}
        </h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-content-muted hover:bg-surface-muted">
          <X {...iconProps} />
        </button>
      </div>
      {/* key: 다른 장소를 고르면 목록을 새로 그려, 앞 장소에서 내려 둔 스크롤 위치가 남지 않게 한다. */}
      {pin.kind === "place" ? (
        // "가볼만한 곳"은 장소 하나라 서버가 그린 장소 카드 하나를 보인다.
        <div key={pin.id} className="min-h-0 overflow-y-auto overscroll-contain p-4">{cards[pin.id]}</div>
      ) : (
        <div key={pin.id} className="grid min-h-0 grid-cols-2 gap-x-3 gap-y-5 overflow-y-auto overscroll-contain p-4">
          {pin.events.map((event) => <div key={event.slug}>{cards[event.slug]}</div>)}
        </div>
      )}
    </section>
  );
}
