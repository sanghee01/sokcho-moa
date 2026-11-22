import { Suspense, type ReactNode } from "react";
import { EventCard } from "@/features/events/components/event-card";
import { EventMap } from "@/features/events/components/map/event-map";
import type { Event } from "@/features/events/model/event";
import { selectEventMapPlaces, toEventMapPins, type PlaceMapPin } from "@/features/events/model/event-map";

/**
 * 지도 탭 화면(.ai/DESIGN.md 지도). 장소 묶기와 카드는 서버에서 만들고, 지도·핀·칩은 브라우저에서 그린다.
 * 카드는 목록과 같은 EventCard를 서버에서 그려 넘긴다. 브라우저에 행사 전체(Event)를 넘기지 않으려는 것이다.
 * "가볼만한 곳" 핀과 카드는 app/map/page.tsx가 장소 도메인에서 만들어 넘긴다(feature끼리는 model만 import, 2026-11-21).
 */
export function EventMapPage({
  events,
  placePins,
  placeCards,
  clientId,
}: {
  events: Event[];
  placePins: PlaceMapPin[];
  /** 장소 핀 id → 장소 카드 */
  placeCards: Record<string, ReactNode>;
  clientId: string | null;
}) {
  const places = selectEventMapPlaces(events);
  const cards = {
    ...Object.fromEntries(
      places.flatMap((place) => place.events).map((event) => [event.slug, <EventCard key={event.slug} event={event} contentSource="event_map" />]),
    ),
    ...placeCards,
  };

  return (
    // 지도가 헤더와 하단 탭 사이를 꽉 채운다(높이는 이 한 곳에서 정한다). data-full-screen-map이 있으면 globals.css가 공통 푸터를 숨긴다:
    // 푸터가 지도 아래 붙으면 페이지가 화면보다 길어, 칩·헤더를 끌 때 페이지가 스크롤돼 지도가 밀렸다(2026-11-16 사용자 결정).
    // 모바일 하단 탭(--bottom-chrome-height)과 safe area만큼 더 뺀다. body가 그만큼 아래 여백을 두기 때문이다(2026-11-21).
    <main id="main-content" data-full-screen-map className="h-[calc(100svh-var(--site-header-height)-var(--bottom-chrome-height)-env(safe-area-inset-bottom))]">
      <h1 className="sr-only">속초 행사·가볼만한 곳 지도</h1>
      {/* 레이어(?layer=)·분야(?category=)·장소(?place=)를 주소에서 읽어, 정적 페이지를 만들 때는 빈 지도 자리만 그린다. */}
      <Suspense fallback={<div className="h-full bg-surface-muted" />}>
        <EventMap pins={toEventMapPins(places)} placePins={placePins} cards={cards} clientId={clientId} />
      </Suspense>
    </main>
  );
}
