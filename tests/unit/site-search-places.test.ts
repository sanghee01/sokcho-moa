import { describe, expect, it } from "vitest";
import { searchActivityPlaces } from "@/features/places/model/activity";
import type { Place } from "@/features/places/model/place";

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: "20000000-0000-4000-8000-000000000001",
    slug: "sample-place",
    name: "샘플 전시관",
    category: "전시관",
    summary: null,
    address: "강원특별자치도 속초시 중앙로 1",
    latitude: 38.2,
    longitude: 128.59,
    imageUrl: null,
    imageCredit: null,
    imageSourceUrl: null,
    imageAlt: null,
    officialUrl: null,
    mapUrl: null,
    isPublished: true,
    activityCategory: "exhibition",
    tags: [],
    description: null,
    hoursSummary: null,
    closedSummary: null,
    priceSummary: null,
    phone: null,
    parkingSummary: null,
    cautions: [],
    bookingUrl: null,
    operationStatus: "open",
    statusNote: null,
    statusNoteUntil: null,
    verifiedOn: null,
    ...overrides,
  };
}

describe("searchActivityPlaces", () => {
  const museumX = makePlace({ id: "1", slug: "museum-x", name: "뮤지엄엑스" });
  const describedMuseum = makePlace({ id: "2", slug: "media-hall", name: "미디어 체험관", description: "뮤지엄엑스 옆의 체험관입니다." });
  const indoorWater = makePlace({ id: "3", slug: "waterpark", name: "워터파크", activityCategory: "water", tags: ["indoor"] });
  const closed = makePlace({ id: "4", slug: "closed-museum", name: "뮤지엄엑스 옛관", operationStatus: "closed" });
  const uncategorized = makePlace({ id: "5", slug: "beach", name: "뮤지엄엑스 해변", activityCategory: null });
  const places = [describedMuseum, indoorWater, closed, uncategorized, museumX];

  it("띄어쓰기와 대소문자를 무시하고, 이름에 들어 있는 곳을 소개에만 있는 곳보다 앞에 둔다", () => {
    expect(searchActivityPlaces(places, "뮤지엄 엑스").map((place) => place.slug)).toEqual(["museum-x", "media-hall"]);
  });

  it("조건 태그의 화면 이름으로도 찾는다", () => {
    expect(searchActivityPlaces(places, "실내").map((place) => place.slug)).toEqual(["waterpark"]);
  });

  it("운영을 끝낸 곳과 분류가 없는 곳은 찾지 않는다", () => {
    const slugs = searchActivityPlaces(places, "뮤지엄엑스").map((place) => place.slug);
    expect(slugs).not.toContain("closed-museum");
    expect(slugs).not.toContain("beach");
  });

  it("빈 검색어나 공백만 있으면 아무것도 돌려주지 않는다", () => {
    expect(searchActivityPlaces(places, "")).toEqual([]);
    expect(searchActivityPlaces(places, "   ")).toEqual([]);
  });
});
