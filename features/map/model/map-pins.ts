// 지도 탭(/map)의 핀. 참여할 수 있는 행사를 장소별로 묶는다.
// 행사가 문화예술회관·도서관 같은 몇 시설에 몰려 있어, 행사마다 핀을 찍으면 같은 자리에 겹쳐 누를 수 없다(2026-11-16).
import type { Event } from "@/features/events/model/event";
import { filterEvents, sortEvents } from "@/features/events/model/event-list";
import { isEventCategory, type EventCategory } from "@/features/events/model/taxonomy";
import { activityCategories, isActivityCategory, type ActivityCategory } from "@/features/places/model/activity";
import { DEFAULT_LIST_REGION, getPlaceRegion, placeRegions, type PlaceRegion } from "@/features/places/model/region";
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

/**
 * 지도 화면(브라우저)에 넘기는 핀. 핀과 접근성 이름, 분야 거르기에 필요한 필드만 둔다. 카드는 서버가 따로 그려 넘긴다.
 * 행사 장소 핀(venue)은 장소별로 묶은 행사를 갖고, "가볼만한 곳" 핀(place)은 장소 하나와 그 분류를 갖는다(2026-11-21).
 * 종류(kind)를 반드시 적는다. 예전에는 행사 핀에 선택 칸(kind?, placeCategory?)을 덧붙여 장소 핀을 담아, 장소 핀에도 빈 events가 있고
 * 분류가 없을 수 있다고 타입이 말했다. 새 종류를 더할 때 고칠 곳을 컴파일러가 찾게 나눴다(2026-11-22 리뷰, 사용자 결정).
 */
interface MapPinBase {
  id: string;
  latitude: number;
  longitude: number;
}

export interface VenueMapPin extends MapPinBase {
  kind: "venue";
  /** 장소 이름이 없는 행사만 있으면 null */
  name: string | null;
  events: Pick<Event, "slug" | "category">[];
}

export interface PlaceMapPin extends MapPinBase {
  kind: "place";
  name: string;
  placeCategory: ActivityCategory;
  /** 목록 판 줄의 지역 이름과 첫 보기 맞추기에 쓴다(2026-11-22). 속초·고성·양양 밖이면 null */
  region: PlaceRegion | null;
}

export type MapPin = VenueMapPin | PlaceMapPin;

/** 지도 레이어. 한 번에 한 종류만 보여 범례 없이도 핀이 무엇인지 알 수 있게 한다(2026-11-21). */
export const mapLayers = ["events", "places"] as const;
export type MapLayer = (typeof mapLayers)[number];

/**
 * 지도가 보여 주는 것: 레이어와 그 레이어의 분야. 분야 값의 종류가 레이어마다 달라 함께 묶는다(주소 ?layer=&category=).
 * 지도는 지역으로 거르지 않는다. 속초·고성·양양 장소를 모두 보이고 어디인지는 지도와 카드·목록 판의 지역 이름이 알려 준다
 * (2026-11-22 사용자 결정: 지도에서는 굳이 지역을 나눌 필요 없음). 예전 공유 주소의 ?region=은 무시한다.
 */
export type MapFilter =
  | { layer: "events"; category: EventCategory | null }
  | { layer: "places"; category: ActivityCategory | null };

/** 레이어와 분야 값(주소·분야 칩의 문자열)으로 지도 필터를 만든다. 그 레이어에 없는 분야면 전체로 본다. */
export function createMapFilter(layer: MapLayer, category: string | null | undefined): MapFilter {
  const value = category ?? undefined;
  if (layer === "places") return { layer, category: isActivityCategory(value) ? value : null };
  return { layer, category: isEventCategory(value) ? value : null };
}

/** 핀이 지도 필터에 보이는지. 다른 레이어의 핀은 보이지 않는다. */
export function isPinInFilter(pin: MapPin, filter: MapFilter) {
  if (pin.kind === "place") return filter.layer === "places" && (filter.category === null || pin.placeCategory === filter.category);
  return filter.layer === "events" && (filter.category === null || pin.events.some((event) => event.category === filter.category));
}

export function isMapLayer(value: string | null | undefined): value is MapLayer {
  return mapLayers.some((layer) => layer === value);
}

/** "가볼만한 곳" 장소 핀의 id. 행사 장소 id(좌표)와 겹치지 않게 앞에 place:를 붙인다. 주소(?place=)에 남는다. */
export function placeMapPinId(slug: string) {
  return `place:${slug}`;
}

/** "가볼만한 곳"을 지도 핀으로 바꾼다. 지도 범위 밖 좌표는 뺀다. 화면 순서(북쪽에서 남쪽)로 놓는다. */
export function toPlaceMapPins(
  places: readonly { id: string; slug: string; name: string; address: string | null; latitude: number; longitude: number; activityCategory: ActivityCategory }[],
): PlaceMapPin[] {
  return places
    .filter((place) => isInMapRegion(place.latitude, place.longitude))
    .map((place) => ({
      kind: "place" as const,
      id: placeMapPinId(place.slug),
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      placeCategory: place.activityCategory,
      region: getPlaceRegion(place),
    }))
    .sort(compareNorthWest);
}

/**
 * 가볼만한 곳 레이어의 분류 칩으로 보일 분류. 장소 핀이 있는 분류만 칩 순서대로 돌려준다. 이미 고른 분류는 핀이 없어도 남긴다
 * (고른 칩이 사라지면 무엇을 보는지 알 수 없음). 누르면 빈 지도가 되는 칩을 보이지 않으려는 것이다(2026-11-22 리뷰).
 */
export function listPlacePinCategories(pins: readonly PlaceMapPin[], selected: ActivityCategory | null): ActivityCategory[] {
  const used = new Set(pins.map((pin) => pin.placeCategory));
  return activityCategories.filter((category) => category === selected || used.has(category));
}

/** 고른 분야의 "가볼만한 곳" 핀만 남긴다. category가 없으면 그대로 돌려준다. */
export function filterPlaceMapPins(pins: readonly PlaceMapPin[], category: ActivityCategory | null): PlaceMapPin[] {
  return category === null ? [...pins] : pins.filter((pin) => pin.placeCategory === category);
}

/**
 * md 이상 왼쪽 목록 판의 줄 순서. 가볼만한 곳 핀은 속초 → 고성 → 양양(가볼만한 곳 목록과 같은 지역 순서), 지역 안에서는 지금처럼 북쪽부터다.
 * 화면 순서(북쪽부터)만 쓰면 맨 위에 고성 통일전망대 쪽이 먼저 나와 속초 장소를 한참 내려야 보였다(2026-11-22 사용자 요청: 속초를 먼저).
 * 핀 버튼의 Tab 순서는 지도 위 화면 순서 그대로다. 행사 핀은 지역이 없어 순서를 바꾸지 않는다.
 */
export function orderPinsForList<TPin extends MapPin>(pins: readonly TPin[]): TPin[] {
  return pins.map((pin, index) => ({ pin, index })).sort((a, b) => listRegionOrder(a.pin) - listRegionOrder(b.pin) || a.index - b.index).map(({ pin }) => pin);
}

/** 목록 판의 지역 순서(속초·고성·양양). 지역을 모르는 장소 핀은 맨 뒤, 행사 핀은 모두 같다. */
function listRegionOrder(pin: MapPin) {
  if (pin.kind !== "place") return 0;
  return pin.region === null ? placeRegions.length : placeRegions.indexOf(pin.region);
}

/**
 * 핀 구성이 바뀔 때(처음 열기·레이어·분야) 지도 보기를 어떻게 옮길지. 주소의 장소(?place=)로 열거나 상세에서 돌아와 보기를 되살린 경우는 화면이 먼저 따로 다룬다.
 * - 가볼만한 곳 전체: 처음에는 만들 때의 속초 시내 기본 보기 그대로(none), 레이어를 바꾸거나 분야를 전체로 돌리면 기본 보기로(default).
 *   모든 핀에 맞추면 고성 남쪽~양양까지 넓게 열려 속초 핀이 작은 묶음으로만 보였다(2026-11-22 사용자 피드백: 처음부터 속초가 보여야 함).
 * - 가볼만한 곳 분야: 그 분야 핀에 맞춘다(fit, 속초 핀 기준·최소 확대 수준은 화면이 정함).
 * - 행사: 늘 핀에 맞춘다. 행사는 거의 속초라 맞춰도 시내가 보인다.
 */
export function selectMapCameraMove(filter: MapFilter, isFirstFit: boolean): "none" | "default" | "fit" {
  if (filter.layer === "places" && filter.category === null) return isFirstFit ? "none" : "default";
  return "fit";
}

/**
 * 지도 보기를 맞출 때 기준으로 삼을 핀. 가볼만한 곳 핀은 속초에 있는 핀이 있으면 그 핀에만 맞춘다(나머지 핀도 지도에는 그대로 보인다).
 * 지역으로 거르지 않고 모든 핀에 맞추면 북쪽 통일전망대부터 남쪽 양양까지 담느라 속초 시내가 알아볼 수 없을 만큼 작아졌다(2026-11-22 화면 확인).
 * 속초 핀이 없으면(고성·양양에만 있는 분류) 보이는 핀 전체에 맞춘다. 행사 핀은 그대로 둔다.
 */
export function selectCameraPins(pins: readonly MapPin[]): MapPin[] {
  const defaultRegionPins = pins.filter((pin) => pin.kind === "place" && pin.region === DEFAULT_LIST_REGION);
  const hasOnlyPlacePins = pins.every((pin) => pin.kind === "place");
  return hasOnlyPlacePins && defaultRegionPins.length > 0 ? defaultRegionPins : [...pins];
}

export function toEventMapPins(places: readonly EventMapPlace[]): VenueMapPin[] {
  return places.map(({ id, name, latitude, longitude, events }) => ({
    kind: "venue" as const,
    id,
    name,
    latitude,
    longitude,
    events: events.map(({ slug, category }) => ({ slug, category })),
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
