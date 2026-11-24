import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { EventCard } from "@/features/events/components/event-card";
import { PUBLIC_EVENTS_CACHE_TAG } from "@/features/events/cache";
import { getAllPublicEvents } from "@/features/events/queries";
import { MapScreen } from "@/features/map/components/map-screen";
import { placeMapPinId, selectEventMapPlaces, toEventMapPins, toPlaceMapPins } from "@/features/map/model/map-pins";
import { PlaceMapCard } from "@/features/places/components/place-map-card";
import { selectActivityPlaces } from "@/features/places/model/activity";
import { PUBLIC_PLACES_CACHE_TAG } from "@/features/places/cache";
import { getPublicPlaces } from "@/features/places/queries";
import { getNaverMapClientId } from "@/lib/env";
import { PUBLIC_PAGE_CACHE_LIFE } from "@/lib/public-cache-life";

// 미리 만든 정적 결과로만 응답해야 하는 페이지다. 누가 요청 값(searchParams·cookies)이나 캐시하지 않은 조회를 더하면 빌드가 멈춘다.
// 루트 layout의 instant = false가 사이트 전체의 미리 만들기 검사를 끄므로, 검색 유입을 받는 정적 페이지는 여기서 따로 지킨다(2026-11-24 리뷰).
export const ensureStatic = "navigation";

// 화면 내용 대부분이 지도(스크립트)라 검색 결과에 올리지 않는다. 행사 상세·목록·월별 페이지가 검색을 맡는다(2026-11-16).
export const metadata: Metadata = {
  title: "지도",
  description: "속초에서 지금 열리는 행사와 가볼만한 곳을 지도에서 찾아보세요.",
  alternates: { canonical: "/map" },
  robots: { index: false, follow: true },
};

export default async function MapPage() {
  // 끝나거나 신청이 마감된 행사를 핀에서 빼려고 지금 시각으로 고르고, 그린 결과를 5분 저장해 둔다(월별 페이지와 같은 주기).
  // 예전에는 revalidate로 정했다. cacheComponents에서는 미리 만드는 화면이 new Date()를 쓰려면 저장 기간을 정해야 한다(2026-11-24).
  "use cache";
  cacheLife(PUBLIC_PAGE_CACHE_LIFE);
  cacheTag(PUBLIC_EVENTS_CACHE_TAG, PUBLIC_PLACES_CACHE_TAG);
  const [events, places] = await Promise.all([getAllPublicEvents(), getPublicPlaces()]);
  const eventPlaces = selectEventMapPlaces(events);
  const activityPlaces = selectActivityPlaces(places);
  // 카드는 목록과 같은 EventCard·장소 카드를 서버에서 그려 넘긴다. 브라우저에 행사 전체(Event)를 넘기지 않으려는 것이다.
  const cards = {
    ...Object.fromEntries(eventPlaces.flatMap((place) => place.events).map((event) => [event.slug, <EventCard key={event.slug} event={event} contentSource="event_map" />])),
    ...Object.fromEntries(activityPlaces.map((place) => [placeMapPinId(place.slug), <PlaceMapCard key={place.slug} place={place} />])),
  };
  return (
    <MapScreen
      pins={toEventMapPins(eventPlaces)}
      placePins={toPlaceMapPins(activityPlaces)}
      cards={cards}
      clientId={getNaverMapClientId()}
    />
  );
}
