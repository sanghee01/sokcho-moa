import { describe, expect, it } from "vitest";
import { createMapFilter, filterEventMapPlaces, filterPlaceMapPins, isPinInFilter, listPlacePinCategories, orderPinsForList, selectCameraPins, selectMapCameraMove, selectEventMapPlaces, toPlaceMapPins, type PlaceMapPin, type VenueMapPin } from "@/features/map/model/map-pins";
import type { Venue } from "@/features/events/model/venue";
import { makeEvent, NOW } from "@/tests/unit/support/event-builder";

// 지도 탭의 핀: 참여할 수 있는 행사를 장소별로 묶는다. 한 시설에 행사가 여러 개여도 핀은 하나다.
const ART_CENTER = { locationName: "속초문화예술회관 대공연장", latitude: 38.212623, longitude: 128.588542 };
const LIBRARY = { locationName: "속초시립도서관", latitude: 38.20771, longitude: 128.592084 };
/** 장소 사전 없이 행사에 저장된 좌표만 쓰는 경우 */
const NO_VENUES: Venue[] = [];
/** 실제 사전과 같은 모양의 시험용 사전. 문화예술회관은 행사에 저장된 좌표와 20m쯤 떨어져 있다(출처가 달라서). */
const TEST_VENUES: Venue[] = [
  {
    name: "속초문화예술회관",
    aliases: [],
    address: "강원특별자치도 속초시 번영로 155",
    sourceUrl: "https://example.org/arts",
    coordinates: { latitude: 38.212712, longitude: 128.588782, sourceUrl: "https://example.org/osm/arts" },
  },
  { name: "속초시청소년수련관", aliases: [], address: "강원특별자치도 속초시 관광로363번길 14", sourceUrl: "https://example.org/youth" },
];

describe("selectEventMapPlaces와 장소 사전", () => {
  it("좌표가 없는 행사도 장소 사전에 시설 좌표가 있으면 그 시설에 핀을 찍는다", () => {
    const play = makeEvent({ slug: "play", locationName: "속초문화예술회관 소공연장" });

    const places = selectEventMapPlaces([play], TEST_VENUES, NOW);

    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ name: "속초문화예술회관", latitude: 38.212712, longitude: 128.588782 });
  });

  it("행사에 저장된 좌표와 사전 좌표가 조금 달라도 같은 시설이면 핀 하나로 묶는다", () => {
    const concert = makeEvent({ slug: "concert", ...ART_CENTER });
    const play = makeEvent({ slug: "play", locationName: "속초문화예술회관 소공연장" });

    const places = selectEventMapPlaces([concert, play], TEST_VENUES, NOW);

    expect(places).toHaveLength(1);
    expect(places[0].events.map((event) => event.slug).sort()).toEqual(["concert", "play"]);
  });

  it("사전에서 찾은 시설이면 장소 이름으로 사전의 시설 이름을 쓴다", () => {
    // "노리숲길", "기획전시실"처럼 지도 검색용으로 떼는 목록에 없는 공간 이름이 붙어도 시설 이름만 보인다.
    const exhibition = makeEvent({ slug: "exhibition", locationName: "속초문화예술회관 기획전시실(1층)" });

    expect(selectEventMapPlaces([exhibition], TEST_VENUES, NOW)[0].name).toBe("속초문화예술회관");
  });

  // 장소 id는 주소(?place=)에 남는다. 맨 앞 행사가 끝날 때마다 바뀌면 상세에서 뒤로 오거나 공유한 주소로 카드가 열리지 않는다.
  it("신청 마감이 가장 가까운 행사가 끝나도 사전 시설 장소의 id와 위치는 그대로다", () => {
    // 저장 좌표(ART_CENTER)는 사전 좌표와 20m쯤 떨어져 있다.
    const endsSoon = makeEvent({ slug: "ends-soon", ...ART_CENTER, applicationEndAt: "2026-07-20T10:00:00.000Z", eventEndAt: "2026-07-21T00:00:00.000Z" });
    const later = makeEvent({ slug: "later", locationName: "속초문화예술회관 소공연장" });

    const [before] = selectEventMapPlaces([endsSoon, later], TEST_VENUES, NOW);
    const [after] = selectEventMapPlaces([endsSoon, later], TEST_VENUES, new Date("2026-07-22T03:00:00.000Z"));

    expect(before.events.map((event) => event.slug)).toEqual(["ends-soon", "later"]);
    expect(after.events.map((event) => event.slug)).toEqual(["later"]);
    expect(after).toMatchObject({ id: before.id, latitude: before.latitude, longitude: before.longitude });
  });

  it("사전에 있어도 좌표를 확인하지 못한 시설은 지도에 올리지 않는다", () => {
    const camp = makeEvent({ slug: "camp", locationName: "속초시청소년수련관 강당" });

    expect(selectEventMapPlaces([camp], TEST_VENUES, NOW)).toEqual([]);
  });
});

describe("selectEventMapPlaces", () => {
  it("같은 좌표의 행사를 한 장소로 묶고, 방·층 이름을 뗀 시설 이름을 붙인다", () => {
    const concert = makeEvent({ slug: "concert", ...ART_CENTER });
    const play = makeEvent({ slug: "play", ...ART_CENTER, locationName: "속초문화예술회관 소공연장" });
    const reading = makeEvent({ slug: "reading", ...LIBRARY });

    const places = selectEventMapPlaces([concert, play, reading], NO_VENUES, NOW);

    expect(places).toHaveLength(2);
    const artCenter = places.find((place) => place.name === "속초문화예술회관");
    expect(artCenter?.events.map((event) => event.slug).sort()).toEqual(["concert", "play"]);
    expect(artCenter).toMatchObject({ latitude: ART_CENTER.latitude, longitude: ART_CENTER.longitude });
    expect(places.find((place) => place.name === "속초시립도서관")?.events).toHaveLength(1);
  });

  it("출처마다 몇 미터 어긋난 좌표도 같은 장소로 묶고, 수백 미터 떨어지면 나눈다", () => {
    const base = makeEvent({ slug: "base", ...ART_CENTER });
    const fewMetersAway = makeEvent({ slug: "few-meters", ...ART_CENTER, latitude: ART_CENTER.latitude + 0.0001 }); // 약 11m
    const nextBlock = makeEvent({ slug: "next-block", ...ART_CENTER, longitude: ART_CENTER.longitude + 0.003 }); // 약 260m

    const places = selectEventMapPlaces([base, fewMetersAway, nextBlock], NO_VENUES, NOW);

    expect(places.map((place) => place.events.length).sort()).toEqual([1, 2]);
  });

  it("장소 묶음과 id는 행사 순서(신청 마감)와 상관없다", () => {
    // 북쪽으로 약 25m씩 떨어진 세 행사. 신청 마감 순서만 바꿔도 묶음이 같아야 한다.
    const offsets = [0, 0.000225, 0.00045];
    function build(applicationEndDays: number[]) {
      return offsets.map((offset, index) => makeEvent({
        slug: `spot-${index}`,
        locationName: "공터",
        latitude: 38.2 + offset,
        longitude: 128.59,
        applicationEndAt: `2026-07-${applicationEndDays[index]}T00:00:00.000Z`,
      }));
    }
    function summarize(places: ReturnType<typeof selectEventMapPlaces>) {
      return places.map((place) => ({ id: place.id, slugs: place.events.map((event) => event.slug).sort() }));
    }

    const soonestSouth = summarize(selectEventMapPlaces(build([21, 22, 23]), NO_VENUES, NOW));
    const soonestNorth = summarize(selectEventMapPlaces(build([23, 22, 21]), NO_VENUES, NOW));

    expect(soonestNorth).toEqual(soonestSouth);
  });

  // 핀은 키보드로 고를 수 있는 버튼이라, 화면 순서(북쪽에서 남쪽, 서쪽에서 동쪽)로 두어 Tab이 지도를 위에서 아래로 훑게 한다.
  it("장소는 북쪽에서 남쪽 순서로 둔다", () => {
    const south = makeEvent({ slug: "south", ...LIBRARY, applicationEndAt: "2026-07-21T00:00:00.000Z" });
    const north = makeEvent({ slug: "north", ...ART_CENTER, applicationEndAt: "2026-07-25T00:00:00.000Z" });

    const places = selectEventMapPlaces([south, north], NO_VENUES, NOW);

    expect(places.map((place) => place.events[0].slug)).toEqual(["north", "south"]);
  });

  it("좌표가 없는 행사는 지도에 올리지 않는다", () => {
    const withoutCoordinates = makeEvent({ slug: "area", locationName: "속초해수욕장 일원" });
    const withCoordinates = makeEvent({ slug: "pinned", ...LIBRARY });

    const places = selectEventMapPlaces([withoutCoordinates, withCoordinates], NO_VENUES, NOW);

    expect(places.flatMap((place) => place.events.map((event) => event.slug))).toEqual(["pinned"]);
  });

  it("끝난 행사와 신청이 마감된 행사는 올리지 않고, 아직 시작 전인 행사는 올린다", () => {
    const ended = makeEvent({ slug: "ended", ...LIBRARY, eventStartAt: "2026-07-01T00:00:00.000Z", eventEndAt: "2026-07-05T00:00:00.000Z" });
    const applicationClosed = makeEvent({ slug: "closed", ...LIBRARY, applicationEndAt: "2026-07-10T00:00:00.000Z" });
    const upcoming = makeEvent({ slug: "upcoming", ...LIBRARY, eventStartAt: "2026-08-01T00:00:00.000Z", eventEndAt: "2026-08-02T00:00:00.000Z" });

    const places = selectEventMapPlaces([ended, applicationClosed, upcoming], NO_VENUES, NOW);

    expect(places.flatMap((place) => place.events.map((event) => event.slug))).toEqual(["upcoming"]);
  });

  it("속초·고성·양양 밖의 좌표는 올리지 않는다", () => {
    const seoul = makeEvent({ slug: "seoul", locationName: "코엑스", latitude: 37.511824, longitude: 127.059159 });
    const goseong = makeEvent({ slug: "goseong", locationName: "화진포", latitude: 38.4717, longitude: 128.4447 });
    const yangyang = makeEvent({ slug: "yangyang", locationName: "낙산사", latitude: 38.1247, longitude: 128.6283 });

    const places = selectEventMapPlaces([seoul, goseong, yangyang], NO_VENUES, NOW);

    expect(places.flatMap((place) => place.events.map((event) => event.slug)).sort()).toEqual(["goseong", "yangyang"]);
  });

  it("한 장소 안에서는 신청 마감이 가까운 행사를 앞에 둔다", () => {
    const noApplication = makeEvent({ slug: "no-application", ...LIBRARY });
    const closesLater = makeEvent({ slug: "closes-later", ...LIBRARY, applicationEndAt: "2026-07-30T00:00:00.000Z" });
    const closesSoon = makeEvent({ slug: "closes-soon", ...LIBRARY, applicationEndAt: "2026-07-21T00:00:00.000Z" });

    const places = selectEventMapPlaces([noApplication, closesLater, closesSoon], NO_VENUES, NOW);

    expect(places[0].events.map((event) => event.slug)).toEqual(["closes-soon", "closes-later", "no-application"]);
  });

  it("장소마다 서로 다른 id를 준다", () => {
    const places = selectEventMapPlaces([makeEvent(ART_CENTER), makeEvent(LIBRARY)], NO_VENUES, NOW);

    expect(new Set(places.map((place) => place.id)).size).toBe(2);
  });
});

// 지도 위 분야 칩. 브라우저에서 분야를 바꿀 때 장소 목록을 다시 거른다.
describe("filterEventMapPlaces", () => {
  it("고른 분야의 행사만 남기고, 남은 행사가 없는 장소는 뺀다", () => {
    const lecture = makeEvent({ slug: "lecture", ...LIBRARY, category: "education" });
    const festival = makeEvent({ slug: "festival", ...ART_CENTER, category: "festival" });
    const exhibition = makeEvent({ slug: "exhibition", ...LIBRARY, category: "exhibition" });
    const places = selectEventMapPlaces([lecture, festival, exhibition], NO_VENUES, NOW);

    const filtered = filterEventMapPlaces(places, "education");

    expect(filtered).toHaveLength(1);
    expect(filtered[0].events.map((event) => event.slug)).toEqual(["lecture"]);
  });

  it("분야를 고르지 않으면 모든 장소를 그대로 둔다", () => {
    const places = selectEventMapPlaces([makeEvent(ART_CENTER), makeEvent(LIBRARY)], NO_VENUES, NOW);

    expect(filterEventMapPlaces(places, null)).toEqual(places);
  });
});

// 지도 필터는 레이어마다 분야 값이 달라, 다른 레이어의 분야나 모르는 값은 전체로 본다(2026-11-22 핀 타입 정리).
describe("createMapFilter", () => {
  it("레이어에 맞는 분야만 받고, 아니면 전체로 본다", () => {
    expect(createMapFilter("events", "festival")).toEqual({ layer: "events", category: "festival" });
    expect(createMapFilter("events", "water")).toEqual({ layer: "events", category: null });
    expect(createMapFilter("places", "water")).toEqual({ layer: "places", category: "water" });
    expect(createMapFilter("places", "festival")).toEqual({ layer: "places", category: null });
    expect(createMapFilter("places", null)).toEqual({ layer: "places", category: null });
  });
});

describe("isPinInFilter", () => {
  const venuePin: VenueMapPin = { kind: "venue", id: "v", name: "문화회관", latitude: 38.2, longitude: 128.59, events: [{ slug: "a", category: "performance" }] };
  const placePin: PlaceMapPin = { kind: "place", id: "place:p", name: "워터파크", latitude: 38.2, longitude: 128.59, placeCategory: "water", region: "sokcho" };

  it("행사 장소 핀은 행사 레이어에서 그 분야 행사가 있을 때만 보인다", () => {
    expect(isPinInFilter(venuePin, { layer: "events", category: null })).toBe(true);
    expect(isPinInFilter(venuePin, { layer: "events", category: "performance" })).toBe(true);
    expect(isPinInFilter(venuePin, { layer: "events", category: "festival" })).toBe(false);
    expect(isPinInFilter(venuePin, { layer: "places", category: null })).toBe(false);
  });

  it("가볼만한 곳 핀은 가볼만한 곳 레이어에서 그 분류일 때만 보인다", () => {
    expect(isPinInFilter(placePin, { layer: "places", category: null })).toBe(true);
    expect(isPinInFilter(placePin, { layer: "places", category: "water" })).toBe(true);
    expect(isPinInFilter(placePin, { layer: "places", category: "exhibition" })).toBe(false);
    expect(isPinInFilter(placePin, { layer: "events", category: null })).toBe(false);
  });
});

// 지도는 지역으로 거르지 않고 속초·고성·양양 장소를 모두 보인다(2026-11-22 사용자 결정). 핀의 지역은 목록 판 줄의 지역 이름과 첫 보기 맞추기에 쓴다.
describe("가볼만한 곳 지도의 지역", () => {
  const places = [
    { id: "p1", slug: "naksan-beach", name: "낙산해변", latitude: 38.118, longitude: 128.634, activityCategory: "nature" as const, address: "강원특별자치도 양양군 강현면 해맞이길 55" },
    { id: "20000000-0000-4000-8000-000000000084", slug: "jinburyeong-art-museum", name: "진부령미술관", latitude: 38.266, longitude: 128.359, activityCategory: "exhibition" as const, address: "강원특별자치도 인제군 북면 진부령로 663" },
    { id: "p3", slug: "sokcho-beach", name: "속초해변", latitude: 38.19, longitude: 128.6, activityCategory: "nature" as const, address: "강원특별자치도 속초시 조양동 1" },
  ];

  it("장소 핀에 지역을 붙인다(인제군 주소의 진부령미술관은 고성)", () => {
    expect(toPlaceMapPins(places).map((pin) => [pin.id, pin.region])).toEqual([
      ["place:jinburyeong-art-museum", "goseong"],
      ["place:sokcho-beach", "sokcho"],
      ["place:naksan-beach", "yangyang"],
    ]);
  });

  it("분류 칩은 장소 핀이 있는 분류만 보이고, 이미 고른 분류는 남긴다", () => {
    const pins = toPlaceMapPins(places);
    expect(listPlacePinCategories(pins, null)).toEqual(["nature", "exhibition"]);
    expect(listPlacePinCategories(pins, "water")).toEqual(["nature", "water", "exhibition"]);
    expect(filterPlaceMapPins(pins, "nature").map((pin) => pin.id)).toEqual(["place:sokcho-beach", "place:naksan-beach"]);
  });

  it("왼쪽 목록 판은 속초·고성·양양 순서로, 지역 안에서는 북쪽부터 늘어놓는다", () => {
    const extra = { id: "p4", slug: "hwajinpo-beach", name: "화진포해변", latitude: 38.479, longitude: 128.439, activityCategory: "nature" as const, address: "강원특별자치도 고성군 현내면 초도리 99" };
    const pins = toPlaceMapPins([...places, extra]);
    expect(pins.map((pin) => pin.id)).toEqual(["place:hwajinpo-beach", "place:jinburyeong-art-museum", "place:sokcho-beach", "place:naksan-beach"]);
    expect(orderPinsForList(pins).map((pin) => pin.id)).toEqual(["place:sokcho-beach", "place:hwajinpo-beach", "place:jinburyeong-art-museum", "place:naksan-beach"]);
    // 행사 핀은 지역이 없어 순서를 그대로 둔다.
    const venuePins: VenueMapPin[] = [
      { kind: "venue", id: "a", name: "가", latitude: 38.3, longitude: 128.5, events: [] },
      { kind: "venue", id: "b", name: "나", latitude: 38.2, longitude: 128.5, events: [] },
    ];
    expect(orderPinsForList(venuePins)).toEqual(venuePins);
  });

  it("첫 보기는 속초 핀에 맞추고, 속초 핀이 없으면 보이는 핀 전체에 맞춘다", () => {
    const pins = toPlaceMapPins(places);
    expect(selectCameraPins(pins).map((pin) => pin.id)).toEqual(["place:sokcho-beach"]);
    const exhibitionOnly = filterPlaceMapPins(pins, "exhibition");
    expect(selectCameraPins(exhibitionOnly).map((pin) => pin.id)).toEqual(["place:jinburyeong-art-museum"]);
    // 행사 핀은 그대로다.
    const venuePin: VenueMapPin = { kind: "venue", id: "v", name: "문화회관", latitude: 38.2, longitude: 128.59, events: [{ slug: "a", category: "performance" }] };
    expect(selectCameraPins([venuePin])).toEqual([venuePin]);
  });
});

// 지도 보기를 언제 어떻게 옮길지. 가볼만한 곳은 처음에 속초 시내 기본 보기로 연다(2026-11-22 사용자 피드백: 처음부터 속초가 보여야 함).
describe("selectMapCameraMove", () => {
  it("가볼만한 곳은 처음 열 때 기본 보기를 그대로 두고, 레이어를 바꾸거나 분야를 전체로 돌리면 기본 보기로 간다", () => {
    expect(selectMapCameraMove({ layer: "places", category: null }, true)).toBe("none");
    expect(selectMapCameraMove({ layer: "places", category: null }, false)).toBe("default");
  });

  it("가볼만한 곳 분야를 고르면 그 분야 핀에 맞춘다", () => {
    expect(selectMapCameraMove({ layer: "places", category: "water" }, true)).toBe("fit");
    expect(selectMapCameraMove({ layer: "places", category: "water" }, false)).toBe("fit");
  });

  it("행사 레이어는 지금처럼 늘 핀에 맞춘다", () => {
    expect(selectMapCameraMove({ layer: "events", category: null }, true)).toBe("fit");
    expect(selectMapCameraMove({ layer: "events", category: "festival" }, false)).toBe("fit");
  });
});
