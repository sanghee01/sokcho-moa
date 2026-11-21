import { describe, expect, it } from "vitest";
import { placeFormSchema } from "@/features/places/admin/schemas";
import { selectEventsNearPlace } from "@/features/events/model/location";
import { mapPlaceRow } from "@/features/places/mappers";
import {
  formatVerifiedOn,
  getPlaceDistrictLabel,
  listActivityCategories,
  parseCautions,
  selectActivityPlaces,
  selectSimilarPlaces,
} from "@/features/places/model/activity";
import type { Place } from "@/features/places/model/place";
import { buildPlaceSeoDescription, buildPlaceStructuredData } from "@/features/places/seo";
import { makeEvent, NOW } from "@/tests/unit/support/event-builder";

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: "20000000-0000-4000-8000-000000000001",
    slug: "sample-place",
    name: "샘플 전시관",
    category: "전시관",
    summary: "샘플 한 줄 소개입니다.",
    address: "강원특별자치도 속초시 중앙로 1",
    latitude: 38.2,
    longitude: 128.59,
    imageUrl: null,
    imageCredit: null,
    imageSourceUrl: null,
    imageAlt: null,
    officialUrl: "https://example.com/",
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
    verifiedOn: null,
    ...overrides,
  };
}

describe("selectActivityPlaces", () => {
  const water = makePlace({ id: "1", slug: "water", name: "워터파크", activityCategory: "water" });
  const museumB = makePlace({ id: "2", slug: "museum-b", name: "나 박물관" });
  const museumA = makePlace({ id: "3", slug: "museum-a", name: "가 박물관" });
  const seasonal = makePlace({ id: "4", slug: "seasonal", name: "가가 전시관", operationStatus: "seasonal_closed" });
  const closed = makePlace({ id: "5", slug: "closed", name: "끝난 전시관", operationStatus: "closed" });
  const nearbyOnly = makePlace({ id: "6", slug: "beach", name: "해변", activityCategory: null });
  const places = [museumB, closed, nearbyOnly, seasonal, museumA, water];

  it("분류가 있는 곳만 분류 순서, 정상 운영 먼저, 이름순으로 놓는다", () => {
    expect(selectActivityPlaces(places).map((place) => place.slug)).toEqual(["water", "museum-a", "museum-b", "seasonal"]);
  });

  it("운영을 끝낸 곳과 분류가 없는 곳은 목록에서 뺀다", () => {
    const slugs = selectActivityPlaces(places).map((place) => place.slug);
    expect(slugs).not.toContain("closed");
    expect(slugs).not.toContain("beach");
  });

  it("분류를 주면 그 분류만 고른다", () => {
    expect(selectActivityPlaces(places, "water").map((place) => place.slug)).toEqual(["water"]);
    expect(selectActivityPlaces(places, "marine")).toEqual([]);
  });

  it("장소가 있는 분류만 화면 순서대로 알려 준다", () => {
    expect(listActivityCategories(places)).toEqual(["water", "exhibition"]);
    expect(listActivityCategories([closed, nearbyOnly])).toEqual([]);
  });

  it("같은 분류의 다른 곳에서 자기 자신을 뺀다", () => {
    const current = selectActivityPlaces(places, "exhibition")[0];
    expect(selectSimilarPlaces(current, places).map((place) => place.slug)).toEqual(["museum-b", "seasonal"]);
    expect(selectSimilarPlaces(current, places, 1)).toHaveLength(1);
  });
});

describe("즐길거리 표시 값", () => {
  it("확인일은 날짜 문자열 그대로 읽어 달이 밀리지 않는다", () => {
    expect(formatVerifiedOn("2026-11-01")).toBe("2026년 11월 확인");
    expect(formatVerifiedOn("2026-01-31")).toBe("2026년 1월 확인");
    expect(formatVerifiedOn(null)).toBeNull();
    expect(formatVerifiedOn("2026/11/01")).toBeNull();
  });

  it("유의사항은 줄마다 나누고 빈 줄을 버린다", () => {
    expect(parseCautions("키 130cm 이상\n\n  예약 필수  \n")).toEqual(["키 130cm 이상", "예약 필수"]);
    expect(parseCautions(null)).toEqual([]);
  });

  it("주소에서 시·군 이름을 꺼낸다", () => {
    expect(getPlaceDistrictLabel("강원특별자치도 고성군 토성면 미시령옛길 1153")).toBe("고성");
    expect(getPlaceDistrictLabel("강원특별자치도 속초시 중앙로 338")).toBe("속초");
    expect(getPlaceDistrictLabel(null)).toBeNull();
  });
});

describe("mapPlaceRow", () => {
  const row = {
    id: "20000000-0000-4000-8000-000000000001",
    slug: "sample-place",
    name: "샘플 전시관",
    category: "전시관",
    summary: null,
    address: null,
    latitude: 38.2,
    longitude: 128.59,
    image_url: null,
    image_credit: null,
    image_source_url: null,
    image_alt: null,
    official_url: null,
    map_url: null,
    is_published: true,
    activity_category: "exhibition",
    tags: ["indoor", "pets"],
    description: null,
    hours_summary: null,
    closed_summary: null,
    price_summary: null,
    phone: null,
    parking_summary: null,
    cautions: "키 130cm 이상\n예약 필수",
    booking_url: null,
    operation_status: "seasonal_closed",
    status_note: null,
    verified_on: "2026-11-21",
    created_at: "2026-11-21T00:00:00.000Z",
    updated_at: "2026-11-21T00:00:00.000Z",
  };

  it("분류·태그·운영 상태를 정해진 값으로 좁히고 유의사항을 나눈다", () => {
    expect(mapPlaceRow(row)).toMatchObject({
      activityCategory: "exhibition",
      tags: ["indoor"],
      cautions: ["키 130cm 이상", "예약 필수"],
      operationStatus: "seasonal_closed",
      verifiedOn: "2026-11-21",
    });
  });

  it("모르는 분류는 즐길거리에 올리지 않고, 모르는 운영 상태는 정상으로 본다", () => {
    expect(mapPlaceRow({ ...row, activity_category: "cafe", operation_status: "unknown" })).toMatchObject({ activityCategory: null, operationStatus: "open" });
  });
});

describe("placeFormSchema의 즐길거리 값", () => {
  const input = {
    slug: "sample-place",
    name: "샘플 전시관",
    category: "전시관",
    summary: "",
    address: "",
    latitude: "38.2",
    longitude: "128.59",
    imageUrl: "",
    imageCredit: "",
    imageSourceUrl: "",
    imageAlt: "",
    officialUrl: "",
    mapUrl: "",
    isPublished: true,
    activityCategory: "",
    tags: [],
    description: "",
    hoursSummary: "",
    closedSummary: "",
    priceSummary: "",
    phone: "",
    parkingSummary: "",
    cautions: "",
    bookingUrl: "",
    operationStatus: "open",
    statusNote: "",
    verifiedOn: "",
  };

  it("분류를 비우면 null(주변 명소로만 씀)로 받는다", () => {
    expect(placeFormSchema.parse(input)).toMatchObject({ activityCategory: null, tags: [], verifiedOn: null, bookingUrl: null });
  });

  it("정해진 분류·태그·날짜를 받는다", () => {
    const parsed = placeFormSchema.parse({ ...input, activityCategory: "water", tags: ["indoor", "kids"], verifiedOn: "2026-11-21", bookingUrl: "https://example.com/book" });
    expect(parsed).toMatchObject({ activityCategory: "water", tags: ["indoor", "kids"], verifiedOn: "2026-11-21", bookingUrl: "https://example.com/book" });
  });

  it("모르는 분류·태그·운영 상태, 틀린 날짜, http가 아닌 예매 주소는 거부한다", () => {
    expect(placeFormSchema.safeParse({ ...input, activityCategory: "cafe" }).success).toBe(false);
    expect(placeFormSchema.safeParse({ ...input, tags: ["pets"] }).success).toBe(false);
    expect(placeFormSchema.safeParse({ ...input, operationStatus: "unknown" }).success).toBe(false);
    expect(placeFormSchema.safeParse({ ...input, verifiedOn: "2026-13-40" }).success).toBe(false);
    expect(placeFormSchema.safeParse({ ...input, bookingUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("selectEventsNearPlace", () => {
  const place = { latitude: 38.2, longitude: 128.59 };

  it("300m 안에서 지금 참여할 수 있는 행사를 가까운 순으로 고른다", () => {
    const here = makeEvent({ id: "here", slug: "here", latitude: 38.2001, longitude: 128.59 });
    const near = makeEvent({ id: "near", slug: "near", latitude: 38.202, longitude: 128.59 });
    const far = makeEvent({ id: "far", slug: "far", latitude: 38.21, longitude: 128.59 });
    expect(selectEventsNearPlace(place, [far, near, here], 4, NOW).map((event) => event.slug)).toEqual(["here", "near"]);
  });

  it("끝난 행사와 좌표를 알 수 없는 행사는 고르지 않는다", () => {
    const ended = makeEvent({ id: "ended", slug: "ended", latitude: 38.2, longitude: 128.59, eventStartAt: "2026-06-01T00:00:00.000Z", eventEndAt: "2026-06-02T00:00:00.000Z" });
    const unknown = makeEvent({ id: "unknown", slug: "unknown", latitude: null, longitude: null, locationName: "속초시 일원" });
    expect(selectEventsNearPlace(place, [ended, unknown], 4, NOW)).toEqual([]);
  });
});

describe("즐길거리 구조화 데이터", () => {
  const place = selectActivityPlaces([makePlace({ tags: ["free"], phone: "033-000-0000", hoursSummary: "매일 10:00~18:00", priceSummary: "무료" })])[0];

  it("운영시간과 별점은 넣지 않고 주소·좌표·공식 주소만 알린다", () => {
    const data = buildPlaceStructuredData(place, "https://sokchomoa.com");
    expect(data).toMatchObject({
      "@type": "TouristAttraction",
      name: "샘플 전시관",
      url: "https://sokchomoa.com/places/sample-place",
      sameAs: ["https://example.com/"],
      isAccessibleForFree: true,
    });
    expect(data).not.toHaveProperty("openingHoursSpecification");
    expect(data).not.toHaveProperty("aggregateRating");
  });

  it("검색 결과 설명에 소개와 운영시간·요금을 함께 쓴다", () => {
    const description = buildPlaceSeoDescription(place);
    expect(description).toContain("샘플 한 줄 소개입니다.");
    expect(description).toContain("운영시간 매일 10:00~18:00");
    expect(description.length).toBeLessThanOrEqual(160);
  });
});
