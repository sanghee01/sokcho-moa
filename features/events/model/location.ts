import type { Event } from "@/features/events/model/event";
import type { NearbyPlace, Place } from "@/features/places/model/place";
import { createMapSearchName, createNaverMapUrl, distanceInKm } from "@/lib/map";

const nearbyRegions = [
  { label: "속초", marker: "속초시", latitude: 38.207, longitude: 128.591 },
  { label: "고성", marker: "고성군", latitude: 38.38, longitude: 128.467 },
  { label: "양양", marker: "양양군", latitude: 38.075, longitude: 128.619 },
] as const;

export function findNearbyPlaces(event: Event, places: Place[], limit = 4): NearbyPlace[] {
  if (event.latitude != null && event.longitude != null) {
    return places
      .map((place) => ({
        ...place,
        distanceKm: distanceInKm(event.latitude!, event.longitude!, place.latitude, place.longitude),
      }))
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
      .slice(0, limit);
  }

  const region = getEventRegion(event);
  const regionalPlaces = region
    ? places.filter((place) => place.address?.includes(region.marker))
    : places;
  const candidates = regionalPlaces.length > 0 ? regionalPlaces : places;
  const center = region ?? nearbyRegions[0];
  const sorted = candidates
    .map((place) => ({
      place,
      distanceFromRegionCenter: distanceInKm(center.latitude, center.longitude, place.latitude, place.longitude),
    }))
    .sort((a, b) => a.distanceFromRegionCenter - b.distanceFromRegionCenter)
    .map(({ place }) => ({ ...place, distanceKm: null }));

  return takeCategoryDiversePlaces(sorted, limit);
}

/** 주변 명소 구역의 제목. 좌표가 없으면 지역 이름으로 바꾼다. 화면이 쓰지 않던 eyebrow·isRegionalFallback은 지웠다(2026-11-07). */
export function getNearbyPlacesLabel(event: Event) {
  if (event.latitude != null && event.longitude != null) {
    return { title: "주변 명소 둘러보기" };
  }

  const region = getEventRegion(event);
  return { title: region ? `${region.label} 지역 명소 둘러보기` : "속초·고성·양양 명소 둘러보기" };
}

function getEventRegion(event: Pick<Event, "address" | "locationName">) {
  const locationText = [event.address, event.locationName].filter(Boolean).join(" ");
  return nearbyRegions.find((region) => locationText.includes(region.marker) || locationText.includes(region.label)) ?? null;
}

function takeCategoryDiversePlaces(places: NearbyPlace[], limit: number) {
  const selected: NearbyPlace[] = [];
  const selectedIds = new Set<string>();
  const categories = new Set<string>();

  for (const place of places) {
    if (selected.length >= limit) break;
    if (categories.has(place.category)) continue;
    selected.push(place);
    selectedIds.add(place.id);
    categories.add(place.category);
  }

  for (const place of places) {
    if (selected.length >= limit) break;
    if (selectedIds.has(place.id)) continue;
    selected.push(place);
  }

  return selected;
}

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
