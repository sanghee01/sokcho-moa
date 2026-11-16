// 지도 탭(/map)의 핀. 참여할 수 있는 행사를 장소별로 묶는다.
// 행사가 문화예술회관·도서관 같은 몇 시설에 몰려 있어, 행사마다 핀을 찍으면 같은 자리에 겹쳐 누를 수 없다(2026-11-16).
import type { Event } from "@/features/events/model/event";
import { filterEvents, sortEvents } from "@/features/events/model/event-list";
import type { EventCategory } from "@/features/events/model/taxonomy";
import { findVenueName, resolveEventCoordinates, venues, type Coordinates, type Venue } from "@/features/events/model/venue";
import { createMapSearchName, distanceInKm } from "@/lib/map";

/** 지도가 다루는 범위(속초·고성·양양을 감싸는 사각형). 범위 밖 좌표(다른 지역에서 여는 행사)는 핀으로 올리지 않고, 지도도 이 밖으로는 옮기지 않는다. */
export const MAP_REGION_BOUNDS = { south: 37.85, north: 38.65, west: 128.15, east: 128.8 } as const;

/** 처음 보여 줄 곳. 행사가 하나도 없을 때도 속초 시내가 보이게 한다. */
export const MAP_DEFAULT_CENTER = { latitude: 38.207, longitude: 128.591 } as const;

/** 이 거리 안의 좌표는 같은 시설로 본다. 같은 건물도 출처에 따라 좌표가 몇 미터씩 어긋난다. */
const SAME_PLACE_DISTANCE_KM = 0.03;

export interface EventMapPlace {
  /**
   * 핀 하나를 가리키는 값. 주소(?place=)에 남는다. 사전 시설이면 시설 좌표, 아니면 그 장소에서 가장 북서쪽 행사의 좌표로 만들어
   * 신청 마감 순서가 바뀌어도 같다. 사전에 없는 장소는 그 기준 행사가 지도에서 빠질 때만 바뀐다.
   */
  id: string;
  /** 방·층 이름을 뗀 시설 이름. 장소 이름이 없는 행사만 있으면 null */
  name: string | null;
  latitude: number;
  longitude: number;
  /** 이 장소의 행사. 신청 마감이 가까운 순서 */
  events: Event[];
}

/**
 * 지도에 찍을 장소 목록. 홈의 "진행중" 탭과 같은 기준(끝나지 않았고 신청이 마감되지 않음)의 행사 중 좌표가 있는 것만 쓴다.
 * 좌표는 행사에 저장된 값이 우선이고, 없으면 장소 사전(data/venues.json)의 시설 좌표를 쓴다. 대부분의 행사가 좌표 없이
 * 시설 이름만 있어, 저장된 좌표만 쓰면 2026-11-16 기준 진행 중 행사 22개 중 1개만 지도에 올랐다.
 * 좌표가 없는 행사("○○ 일원", 여러 장소, 온라인)는 대표 좌표를 지어내지 않고 목록에서만 보인다.
 *
 * 묶는 기준점은 날마다 바뀌는 신청 마감 순서가 아니라 고정된 순서로 고른다: 사전 시설 좌표가 먼저이고, 나머지는 북쪽·서쪽 행사부터다.
 * 마감 순서로 고르면 맨 앞 행사가 끝날 때마다 장소 id(?place=)와 핀 위치, 묶음까지 바뀌었다(2026-11-16 리뷰).
 * 장소는 화면 순서(북쪽에서 남쪽, 서쪽에서 동쪽)로 돌려준다. 핀 버튼의 Tab 순서가 이 순서다.
 */
export function selectEventMapPlaces(events: Event[], venueList: readonly Venue[] = venues, now = new Date()): EventMapPlace[] {
  const activeEvents = sortEvents(filterEvents(events, { status: "active" }, now), "deadline", now);
  const deadlineOrder = new Map(activeEvents.map((event, index) => [event.id, index]));
  const located = activeEvents
    .map((event) => ({ event, coordinates: resolveEventCoordinates(event, venueList) }))
    .filter((item): item is { event: Event; coordinates: Coordinates } =>
      item.coordinates !== null && isInMapRegion(item.coordinates.latitude, item.coordinates.longitude))
    .sort((a, b) => compareNorthWest(a.coordinates, b.coordinates));

  // 사전 시설은 행사가 붙을 때만 지도에 오른다(아래에서 빈 장소를 뺀다).
  const places: EventMapPlace[] = venueList.flatMap((venue) => venue.coordinates === undefined ? [] : [{
    id: createPlaceId(venue.coordinates),
    name: venue.name,
    latitude: venue.coordinates.latitude,
    longitude: venue.coordinates.longitude,
    events: [],
  }]);

  for (const { event, coordinates } of located) {
    const { latitude, longitude } = coordinates;
    const place = places.find((candidate) => distanceInKm(candidate.latitude, candidate.longitude, latitude, longitude) <= SAME_PLACE_DISTANCE_KM);
    if (place) place.events.push(event);
    else places.push({ id: createPlaceId(coordinates), name: null, latitude, longitude, events: [event] });
  }

  return places
    .filter((place) => place.events.length > 0)
    .map((place) => {
      // 카드 안은 신청 마감이 가까운 순서이고, 사전에 없는 장소의 이름은 그 순서로 처음 나오는 장소 이름이다.
      const sortedEvents = [...place.events].sort((a, b) => (deadlineOrder.get(a.id) ?? 0) - (deadlineOrder.get(b.id) ?? 0));
      const name = place.name ?? sortedEvents.map((event) => getPlaceName(event, venueList)).find((candidate) => candidate !== null) ?? null;
      return { ...place, name, events: sortedEvents };
    })
    .sort(compareNorthWest);
}

/** 북쪽이 먼저, 같은 위도면 서쪽이 먼저 */
function compareNorthWest(a: Coordinates, b: Coordinates) {
  return b.latitude - a.latitude || a.longitude - b.longitude;
}

function createPlaceId({ latitude, longitude }: Coordinates) {
  return `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
}

/** 지도 화면(브라우저)에 넘기는 장소. 핀과 접근성 이름, 분야 거르기에 필요한 필드만 둔다. 행사 카드는 서버가 따로 그려 넘긴다. */
export interface EventMapPin {
  id: string;
  name: string | null;
  latitude: number;
  longitude: number;
  events: Pick<Event, "slug" | "category" | "imageUrl">[];
}

export function toEventMapPins(places: readonly EventMapPlace[]): EventMapPin[] {
  return places.map(({ id, name, latitude, longitude, events }) => ({
    id,
    name,
    latitude,
    longitude,
    events: events.map(({ slug, category, imageUrl }) => ({ slug, category, imageUrl })),
  }));
}

/**
 * 고른 분야의 행사만 남긴 장소 목록. 남은 행사가 없는 장소는 뺀다. category가 없으면 그대로 돌려준다.
 * 지도 화면은 브라우저에서 분야를 바꾸므로, 화면에 넘기는 가벼운 장소 형태에도 쓸 수 있게 필요한 필드만 받는다.
 */
export function filterEventMapPlaces<TPlace extends { events: readonly { category: EventCategory }[] }>(
  places: readonly TPlace[],
  category: EventCategory | null,
): TPlace[] {
  if (category === null) return [...places];
  return places
    .map((place) => ({ ...place, events: place.events.filter((event) => event.category === category) }))
    .filter((place) => place.events.length > 0);
}

function isInMapRegion(latitude: number, longitude: number) {
  const { south, north, west, east } = MAP_REGION_BOUNDS;
  return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
}

/** 장소 카드 제목. 사전에 있는 시설이면 공식 이름, 아니면 방·층 이름을 뗀 장소 이름이다. */
function getPlaceName(event: Pick<Event, "locationName">, venueList: readonly Venue[]) {
  const name = event.locationName?.trim();
  if (!name) return null;
  return findVenueName(name, venueList) ?? createMapSearchName(name);
}
