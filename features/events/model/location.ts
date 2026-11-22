import type { Event } from "@/features/events/model/event";
import { isEventClosedForDiscovery } from "@/features/events/model/event-state";
import { resolveEventCoordinates } from "@/features/events/model/venue";
import type { Place } from "@/features/places/model/place";
import { createMapSearchName, createNaverMapUrl, distanceInKm } from "@/lib/map";

export interface EventMapLinks {
  naver: string;
  hasCoordinates: boolean;
}

export function createEventMapLinks(
  name: string,
  address: string | null,
  latitude: number | null,
  longitude: number | null,
): EventMapLinks | null {
  const hasCoordinates = latitude != null && longitude != null;
  if (!address && !hasCoordinates) return null;

  const searchName = createMapSearchName(name);
  // 행사 세부 공간명은 네이버 지도에 별도 장소로 등록되지 않은 경우가 많다.
  // 도로명주소가 있으면 이를 우선 검색해 실제 방문 위치를 안정적으로 연다.
  const searchQuery = address?.trim() || searchName;
  const query = encodeURIComponent(searchQuery);
  if (!hasCoordinates) {
    return {
      naver: `https://map.naver.com/p/search/${query}`,
      hasCoordinates: false,
    };
  }

  return {
    naver: createNaverMapUrl(searchQuery, latitude, longitude),
    hasCoordinates: true,
  };
}

/** 장소 상세의 "근처에서 열리는 행사"로 볼 거리. 한 시설의 여러 건물과 바로 옆 광장까지 걸어서 닿는 범위다. */
const NEAR_PLACE_RADIUS_KM = 0.3;

/**
 * 장소에서 가까운 행사: 지금 신청·참여할 수 있는 행사 가운데 NEAR_PLACE_RADIUS_KM 안의 것을 가까운 순으로 고른다.
 * 행사에 좌표가 없으면 지도 탭처럼 장소 사전의 시설 좌표를 쓴다. 좌표를 알 수 없는 행사는 고르지 않는다.
 */
export function selectEventsNearPlace(
  place: Pick<Place, "latitude" | "longitude">,
  events: readonly Event[],
  limit = 4,
  now = new Date(),
): Event[] {
  return events
    .filter((event) => !isEventClosedForDiscovery(event, now))
    .flatMap((event) => {
      const coordinates = resolveEventCoordinates(event);
      if (coordinates === null) return [];
      const distanceKm = distanceInKm(place.latitude, place.longitude, coordinates.latitude, coordinates.longitude);
      return distanceKm <= NEAR_PLACE_RADIUS_KM ? [{ event, distanceKm }] : [];
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map(({ event }) => event);
}
