// 장소 사전: 자주 쓰는 시설의 이름 → 공식 주소(data/venues.json).
// 기관 공고는 "속초문화예술회관 대공연장"처럼 장소 이름만 쓰는 일이 많아, 저장된 주소가 없으면 화면을 그릴 때 사전으로 채운다.
// DB에는 쓰지 않고, 핵심 정보·지도 링크·구조화 데이터·RSS가 같은 주소를 쓰도록 이 파일 한 곳에서 정한다(2026-11-15 사용자 결정).
import { z } from "zod";
import venueCatalog from "@/data/venues.json";
import type { Event } from "@/features/events/model/event";

const venueSchema = z.object({
  name: z.string().trim().min(1),
  /** 공식 표기와 띄어쓰기 외에 다르게 쓰는 이름 */
  aliases: z.array(z.string().trim().min(1)),
  address: z.string().startsWith("강원특별자치도 "),
  /** 주소를 확인한 공식 출처. 공식 누리집에 주소가 없는 거리는 네이버 지도 장소(2026-11-21) */
  sourceUrl: z.string().url(),
  /**
   * 지도 탭의 핀 위치(2026-11-16). OpenStreetMap 시설 요소나 네이버 지도 장소의 좌표를, 그 장소 주소가 공식 주소와 같은지 맞춰 보고 넣는다.
   * OpenStreetMap에 없는 시설이 많아 네이버 지도 장소도 쓰고, 거리는 그 거리 위 한 점을 쓴다(2026-11-21 사용자 결정).
   * 좌표가 없는 시설의 행사는 행사에 좌표가 있을 때만 지도에 오른다.
   */
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    /** 좌표를 가져온 OpenStreetMap 요소나 네이버 지도 장소 */
    sourceUrl: z.string().url(),
  }).optional(),
});

export type Venue = z.infer<typeof venueSchema>;

export const venues: Venue[] = z.object({ venues: z.array(venueSchema) }).parse(venueCatalog).venues;

// 여러 장소("A 및 B", "A / B", "A·B", "A, B")나 넓은 구역("일원", "등")은 한 시설 주소로 대신하지 않는다.
// "등대해수욕장"처럼 이름 안의 "등"은 걸리지 않게 앞뒤 공백이 있을 때만 본다.
const MULTI_PLACE_OR_AREA_PATTERN = /및|\/|·|,|일원|(?:^|\s)등(?:\s|$)/;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** 장소 이름에 맞는 사전 시설의 주소. 시설 이름 뒤의 방·층 이름은 무시하고, 더 긴(구체적인) 시설 이름을 먼저 고른다. */
export function findVenueAddress(locationName: string | null, venueList: readonly Venue[] = venues) {
  return findVenue(locationName, venueList)?.address ?? null;
}

/** 장소 이름에 맞는 사전 시설의 좌표. 시설을 찾는 규칙은 주소와 같고, 좌표를 확인하지 못한 시설이면 null이다. */
export function findVenueCoordinates(locationName: string | null, venueList: readonly Venue[] = venues): Coordinates | null {
  const coordinates = findVenue(locationName, venueList)?.coordinates;
  return coordinates === undefined ? null : { latitude: coordinates.latitude, longitude: coordinates.longitude };
}

/** 장소 이름에 맞는 사전 시설의 공식 이름. 지도 탭의 장소 카드 제목에 쓴다("국립산악박물관 기획전시실" → "국립산악박물관"). */
export function findVenueName(locationName: string | null, venueList: readonly Venue[] = venues) {
  return findVenue(locationName, venueList)?.name ?? null;
}

/** 화면·구조화 데이터·RSS가 쓰는 행사 주소. 저장된 주소가 우선이고, 없으면 장소 사전에서 찾는다. */
export function resolveEventAddress(event: Pick<Event, "address" | "locationName">, venueList: readonly Venue[] = venues) {
  return event.address?.trim() || findVenueAddress(event.locationName, venueList);
}

/**
 * 지도 탭이 핀을 찍는 행사 좌표. 행사에 저장된 좌표가 우선이고, 없으면 장소 사전에서 찾는다.
 * 지도 탭과 가볼만한 곳 상세의 "근처에서 열리는 행사"(selectEventsNearPlace, 2026-11-21)가 쓴다. 구조화 데이터는 저장된 좌표만 쓴다(2026-11-16).
 */
export function resolveEventCoordinates(
  event: Pick<Event, "latitude" | "longitude" | "locationName">,
  venueList: readonly Venue[] = venues,
): Coordinates | null {
  if (event.latitude !== null && event.longitude !== null) return { latitude: event.latitude, longitude: event.longitude };
  return findVenueCoordinates(event.locationName, venueList);
}

function findVenue(locationName: string | null, venueList: readonly Venue[]) {
  const name = locationName?.trim();
  if (!name || MULTI_PLACE_OR_AREA_PATTERN.test(name)) return null;

  const compactLocation = compactName(name);
  const match = venueList
    .flatMap((venue) => [venue.name, ...venue.aliases].map((key) => ({ key: compactName(key), venue })))
    .filter(({ key }) => compactLocation.startsWith(key))
    .sort((a, b) => b.key.length - a.key.length)[0];
  return match?.venue ?? null;
}

function compactName(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
