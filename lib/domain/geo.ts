import type { Event, Place } from "./event";

const EARTH_RADIUS_KM = 6_371;

const nearbyRegions = [
  { label: "속초", marker: "속초시", latitude: 38.207, longitude: 128.591 },
  { label: "고성", marker: "고성군", latitude: 38.38, longitude: 128.467 },
  { label: "양양", marker: "양양군", latitude: 38.075, longitude: 128.619 },
] as const;

export function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const latDelta = toRadians(lat2 - lat1);
  const lonDelta = toRadians(lon2 - lon1);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lonDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export type NearbyPlace = Place & { distanceKm: number | null };

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

export function getNearbyPlacesLabel(event: Event) {
  if (event.latitude != null && event.longitude != null) {
    return { eyebrow: "행사 전후로 함께", title: "주변 명소 둘러보기", isRegionalFallback: false };
  }

  const region = getEventRegion(event);
  return {
    eyebrow: "행사와 함께 둘러보기",
    title: region ? `${region.label} 지역 명소 둘러보기` : "속초·고성·양양 명소 둘러보기",
    isRegionalFallback: true,
  };
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

export function createMapSearchName(name: string) {
  const trimmedName = name.trim();
  const detailSuffixes = [
    /(?:\s+|\(|\[)\s*(?:(?:지하\s*)?\d+\s*층|b\s*\d+(?:\s*층)?)(?:\s*.*)?$/iu,
    /\s+(?:대공연장|소공연장|대회의실|소회의실|시청각실|다목적실|회의실|강의실|세미나실|교육실|체험실|열람실|전시실|연습실|강당|야외무대|야외테라스)(?:\s*.*)?$/u,
    /\s+(?:본관|신관|별관)$/u,
    /\s+일원$/u,
    /\s*\([^)]*(?:시|군|구|읍|면|동|리)\)\s*$/u,
  ];

  const searchName = detailSuffixes.reduce((value, suffix) => {
    const match = value.match(suffix);
    if (match?.index == null || match.index === 0) return value;
    return value.slice(0, match.index).trim();
  }, trimmedName);

  return searchName || trimmedName;
}

export function createNaverMapUrl(name: string, latitude: number, longitude: number) {
  const query = encodeURIComponent(createMapSearchName(name));
  return `https://map.naver.com/p/search/${query}?c=${longitude},${latitude},15,0,0,0,dh`;
}

export type EventMapLinks = {
  naver: string;
  hasCoordinates: boolean;
};

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
