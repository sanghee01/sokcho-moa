import type { Metadata } from "next";
import { EventCard } from "@/features/events/components/event-card";
import { getAllPublicEvents } from "@/features/events/queries";
import { EventMapPage } from "@/features/map/components/event-map-page";
import { placeMapPinId, selectEventMapPlaces, toEventMapPins, toPlaceMapPins } from "@/features/map/model/map-pins";
import { PlaceMapCard } from "@/features/places/components/place-map-card";
import { selectActivityPlaces } from "@/features/places/model/activity";
import { getPublicPlaces } from "@/features/places/queries";
import { getNaverMapClientId } from "@/lib/env";

// 끝나거나 신청이 마감된 행사를 핀에서 빼려고 다시 만든다(월별 페이지와 같은 값).
// 실제 주기는 안에서 쓰는 행사 데이터 캐시(5분, features/events/queries.ts)를 따른다.
export const revalidate = 3600;

// 화면 내용 대부분이 지도(스크립트)라 검색 결과에 올리지 않는다. 행사 상세·목록·월별 페이지가 검색을 맡는다(2026-11-16).
export const metadata: Metadata = {
  title: "지도",
  description: "속초에서 지금 열리는 행사와 가볼만한 곳을 지도에서 찾아보세요.",
  alternates: { canonical: "/map" },
  robots: { index: false, follow: true },
};

export default async function MapPage() {
  const [events, places] = await Promise.all([getAllPublicEvents(), getPublicPlaces()]);
  const eventPlaces = selectEventMapPlaces(events);
  const activityPlaces = selectActivityPlaces(places);
  // 카드는 목록과 같은 EventCard·장소 카드를 서버에서 그려 넘긴다. 브라우저에 행사 전체(Event)를 넘기지 않으려는 것이다.
  const cards = {
    ...Object.fromEntries(eventPlaces.flatMap((place) => place.events).map((event) => [event.slug, <EventCard key={event.slug} event={event} contentSource="event_map" />])),
    ...Object.fromEntries(activityPlaces.map((place) => [placeMapPinId(place.slug), <PlaceMapCard key={place.slug} place={place} />])),
  };
  return (
    <EventMapPage
      pins={toEventMapPins(eventPlaces)}
      placePins={toPlaceMapPins(activityPlaces)}
      cards={cards}
      clientId={getNaverMapClientId()}
    />
  );
}
