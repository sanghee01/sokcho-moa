import { Suspense } from "react";
import { EventCard } from "@/features/events/components/event-card";
import { EventMap } from "@/features/events/components/map/event-map";
import type { Event } from "@/features/events/model/event";
import { selectEventMapPlaces, toEventMapPins } from "@/features/events/model/event-map";

/**
 * 지도 탭 화면(.ai/DESIGN.md 지도). 장소 묶기와 행사 카드는 서버에서 만들고, 지도·핀·분야 칩은 브라우저에서 그린다.
 * 카드는 목록과 같은 EventCard를 서버에서 그려 넘긴다. 브라우저에 행사 전체(Event)를 넘기지 않으려는 것이다.
 */
export function EventMapPage({ events, clientId }: { events: Event[]; clientId: string | null }) {
  const places = selectEventMapPlaces(events);
  const cards = Object.fromEntries(
    places.flatMap((place) => place.events).map((event) => [event.slug, <EventCard key={event.slug} event={event} contentSource="event_map" />]),
  );

  return (
    // 지도가 헤더 아래를 꽉 채운다(높이는 이 한 곳에서 정한다). data-full-screen-map이 있으면 globals.css가 공통 푸터를 숨긴다:
    // 푸터가 지도 아래 붙으면 페이지가 화면보다 길어, 칩·헤더를 끌 때 페이지가 스크롤돼 지도가 밀렸다(2026-11-16 사용자 결정).
    <main id="main-content" data-full-screen-map className="h-[calc(100svh-var(--site-header-height))]">
      <h1 className="sr-only">속초·고성·양양 행사 지도</h1>
      {/* 분야(?category=)와 장소(?place=)를 주소에서 읽어, 정적 페이지를 만들 때는 빈 지도 자리만 그린다. */}
      <Suspense fallback={<div className="h-full bg-surface-muted" />}>
        <EventMap pins={toEventMapPins(places)} cards={cards} clientId={clientId} />
      </Suspense>
    </main>
  );
}
