import type { Metadata } from "next";
import { EventMapPage } from "@/features/events/components/map/event-map-page";
import { placeMapPinId, toPlaceMapPins } from "@/features/events/model/event-map";
import { getAllPublicEvents } from "@/features/events/queries";
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
  const activityPlaces = selectActivityPlaces(places);
  const placeCards = Object.fromEntries(activityPlaces.map((place) => [placeMapPinId(place.slug), <PlaceMapCard key={place.slug} place={place} />]));
  return (
    <EventMapPage
      events={events}
      placePins={toPlaceMapPins(activityPlaces)}
      placeCards={placeCards}
      clientId={getNaverMapClientId()}
    />
  );
}
