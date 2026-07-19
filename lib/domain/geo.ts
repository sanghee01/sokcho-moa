import type { Event, Place } from "./event";

const EARTH_RADIUS_KM = 6_371;

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
  if (event.latitude == null || event.longitude == null) {
    return [];
  }

  return places
    .map((place) => ({
      ...place,
      distanceKm: distanceInKm(event.latitude!, event.longitude!, place.latitude, place.longitude),
    }))
    .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
    .slice(0, limit);
}

export function createNaverMapUrl(name: string, latitude: number, longitude: number) {
  const query = encodeURIComponent(name);
  return `https://map.naver.com/p/search/${query}?c=${longitude},${latitude},15,0,0,0,dh`;
}

export type EventMapLinks = {
  naver: string;
  kakao: string;
  hasVerifiedCoordinates: boolean;
};

export function createEventMapLinks(
  name: string,
  address: string | null,
  latitude: number | null,
  longitude: number | null,
): EventMapLinks | null {
  const hasVerifiedCoordinates = latitude != null && longitude != null;
  if (!address && !hasVerifiedCoordinates) return null;

  const query = encodeURIComponent([name, address].filter(Boolean).join(" "));
  if (!hasVerifiedCoordinates) {
    return {
      naver: `https://map.naver.com/p/search/${query}`,
      kakao: `https://map.kakao.com/link/search/${query}`,
      hasVerifiedCoordinates: false,
    };
  }

  return {
    naver: createNaverMapUrl(name, latitude, longitude),
    kakao: `https://map.kakao.com/link/to/${encodeURIComponent(name)},${latitude},${longitude}`,
    hasVerifiedCoordinates: true,
  };
}
