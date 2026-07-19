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

  const searchName = createMapSearchName(name);
  const searchAddress = address ? createMapSearchName(address) : null;
  const hasInteriorDetails = searchName !== name.trim();
  const query = encodeURIComponent(
    (hasInteriorDetails ? [searchName] : [searchName, searchAddress]).filter(Boolean).join(" "),
  );
  if (!hasVerifiedCoordinates) {
    return {
      naver: `https://map.naver.com/p/search/${query}`,
      hasVerifiedCoordinates: false,
    };
  }

  return {
    naver: createNaverMapUrl(searchName, latitude, longitude),
    hasVerifiedCoordinates: true,
  };
}
