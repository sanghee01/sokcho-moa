import { describe, expect, it } from "vitest";
import { activityListPathForPlace, searchActivityPlaces, selectActivityPlaces, selectSimilarPlaces } from "@/features/places/model/activity";
import type { Place } from "@/features/places/model/place";
import { buildActivityCategorySeoTitle, buildActivityListDescription, buildActivityListStructuredData, buildPlaceBreadcrumbStructuredData, buildPlaceSeoDescription } from "@/features/places/seo";
import {
  filterPlacesByRegion,
  getPlaceRegion,
  getPlaceRegionLabel,
  listPlaceRegions,
  parseListRegion,
  parseSearchRegion,
  choiceOfRegion,
  resolveSearchRegion,
  placeRegionHref,
} from "@/features/places/model/region";

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: "20000000-0000-4000-8000-000000000001",
    slug: "sample-place",
    name: "샘플 해변",
    category: "해변",
    summary: "샘플 한 줄 소개",
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
    activityCategory: "nature",
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
    verifiedOn: "2026-11-22",
    ...overrides,
  };
}

const sokcho = makePlace({ id: "1", slug: "sokcho-beach", name: "속초해변", address: "강원특별자치도 속초시 조양동 1" });
const goseong = makePlace({ id: "2", slug: "hwajinpo-beach", name: "화진포해변", address: "강원특별자치도 고성군 현내면 초도리 99" });
const yangyang = makePlace({ id: "3", slug: "naksan-beach", name: "낙산해변", address: "강원특별자치도 양양군 강현면 해맞이길 55" });
// 고성군이 운영하지만 진부령 고개 너머 인제군 땅에 있는 미술관. 사용자가 고성으로 묶기로 했다(2026-11-22).
const jinburyeong = makePlace({
  id: "20000000-0000-4000-8000-000000000084",
  slug: "jinburyeong-art-museum",
  name: "고성군 진부령미술관",
  activityCategory: "exhibition",
  address: "강원특별자치도 인제군 북면 진부령로 663",
});

describe("getPlaceRegion", () => {
  it("주소의 시·군으로 지역을 정한다", () => {
    expect(getPlaceRegion(sokcho)).toBe("sokcho");
    expect(getPlaceRegion(goseong)).toBe("goseong");
    expect(getPlaceRegion(yangyang)).toBe("yangyang");
  });

  it("주소가 인제군인 진부령미술관은 고성으로 친다", () => {
    expect(getPlaceRegion(jinburyeong)).toBe("goseong");
    expect(getPlaceRegionLabel(jinburyeong)).toBe("고성");
    // 관리자가 slug를 바꿔도 고성이다(예외를 바뀌지 않는 id로 건다, 2026-11-22).
    const renamed: Place = { ...jinburyeong, slug: "renamed-museum" };
    expect(getPlaceRegion(renamed)).toBe("goseong");
  });

  it("세 지역 밖이거나 주소가 없으면 지역이 없다", () => {
    expect(getPlaceRegion(makePlace({ id: "other", address: "강원특별자치도 인제군 북면 한계리" }))).toBeNull();
    expect(getPlaceRegion(makePlace({ address: null }))).toBeNull();
  });
});

describe("parseSearchRegion", () => {
  it("주소의 지역 값만 받고 나머지는 전체(null)로 본다", () => {
    expect(parseSearchRegion("goseong")).toBe("goseong");
    expect(parseSearchRegion(["yangyang", "sokcho"])).toBe("yangyang");
    expect(parseSearchRegion("seoul")).toBeNull();
    expect(parseSearchRegion("")).toBeNull();
    expect(parseSearchRegion(undefined)).toBeNull();
  });
});

describe("전체 지역 값", () => {
  it("거르기의 null(전체)을 화면 경계의 all로 바꾼다", () => {
    expect(choiceOfRegion(null)).toBe("all");
    expect(choiceOfRegion("yangyang")).toBe("yangyang");
  });
});

describe("지역 거르기", () => {
  const places = [sokcho, goseong, yangyang, jinburyeong];

  it("고른 지역의 장소만 남기고, 지역을 고르지 않으면 그대로 둔다", () => {
    expect(filterPlacesByRegion(places, "goseong").map((place) => place.slug)).toEqual(["hwajinpo-beach", "jinburyeong-art-museum"]);
    expect(filterPlacesByRegion(places, null)).toEqual(places);
  });

  it("장소가 있는 지역만 화면 순서(속초·고성·양양)로 돌려준다", () => {
    expect(listPlaceRegions([yangyang, sokcho])).toEqual(["sokcho", "yangyang"]);
    expect(listPlaceRegions(places)).toEqual(["sokcho", "goseong", "yangyang"]);
  });

  // 목록·지도의 기본 지역은 속초다(2026-11-22 사용자 결정). 속초는 주소에 적지 않고, 전체는 ?region=all로 적는다.
  it("목록 주소에는 속초를 적지 않고, 고성·양양·전체는 ?region=으로 남긴다", () => {
    expect(placeRegionHref("/places", "goseong")).toBe("/places?region=goseong");
    expect(placeRegionHref("/places/category/nature", "yangyang")).toBe("/places/category/nature?region=yangyang");
    expect(placeRegionHref("/places", "all")).toBe("/places?region=all");
    expect(placeRegionHref("/places", "sokcho")).toBe("/places");
  });

  it("목록 주소의 지역 값이 없거나 모르는 값이면 속초로 본다", () => {
    expect(parseListRegion(undefined)).toBe("sokcho");
    expect(parseListRegion("seoul")).toBe("sokcho");
    expect(parseListRegion("all")).toBe("all");
    expect(parseListRegion(["goseong"])).toBe("goseong");
  });

  it("상세에 바로 들어왔을 때 돌아갈 목록은 그 장소 지역의 목록이다", () => {
    expect(activityListPathForPlace(sokcho)).toBe("/places");
    expect(activityListPathForPlace(goseong)).toBe("/places?region=goseong");
    expect(activityListPathForPlace(jinburyeong)).toBe("/places?region=goseong");
  });
});

describe("검색에서 지역 이름", () => {
  it("'고성'으로 찾으면 주소가 인제군인 진부령미술관도 나온다", () => {
    expect(searchActivityPlaces([sokcho, goseong, jinburyeong], "고성").map((place) => place.slug)).toEqual(["jinburyeong-art-museum", "hwajinpo-beach"]);
  });
});

describe("같은 분류의 다른 곳", () => {
  it("같은 지역의 장소를 먼저 보이고, 모자라면 다른 지역으로 채운다", () => {
    const sokchoLake = makePlace({ id: "5", slug: "yeongrang-lake", name: "영랑호", address: "강원특별자치도 속초시 장사동 1" });
    const goseongLake = makePlace({ id: "6", slug: "hwajinpo-lake", name: "가화진포", address: "강원특별자치도 고성군 거진읍 화포리" });
    const places = [sokcho, goseong, yangyang, sokchoLake, goseongLake];
    const current = { ...sokcho, activityCategory: "nature" as const };
    expect(selectSimilarPlaces(current, places, 2).map((place) => place.slug)).toEqual(["yeongrang-lake", "hwajinpo-lake"]);
  });
});

describe("장소 상세 검색 설명의 지역", () => {
  it("속초 밖 장소는 그 지역 이름으로 시작하고, 이름에 지역이 이미 있으면 되풀이하지 않는다", () => {
    expect(buildPlaceSeoDescription({ ...goseong, activityCategory: "nature" })).toMatch(/^고성 화진포해변: /);
    expect(buildPlaceSeoDescription({ ...jinburyeong, activityCategory: "exhibition" })).toMatch(/^고성군 진부령미술관: /);
    expect(buildPlaceSeoDescription({ ...sokcho, activityCategory: "nature" })).toMatch(/^속초해변: /);
  });
});

describe("목록 순서의 지역", () => {
  it("같은 분류 안에서는 속초·고성·양양 순서로 놓고, 그 안에서 이름순이다", () => {
    const gajin = makePlace({ id: "7", slug: "gajin-beach", name: "가진해변", address: "강원특별자치도 고성군 죽왕면 가진리" });
    const sokchoB = makePlace({ id: "8", slug: "oeongchi-beach", name: "외옹치해변", address: "강원특별자치도 속초시 대포동 1" });
    expect(selectActivityPlaces([yangyang, gajin, goseong, sokchoB, sokcho]).map((place) => place.name)).toEqual(["속초해변", "외옹치해변", "가진해변", "화진포해변", "낙산해변"]);
  });
});

describe("목록 검색 설명의 예시 장소", () => {
  it("목록이 처음 보이는 속초 장소에서 예시를 고른다", () => {
    const nature = [goseong, yangyang, sokcho].map((place) => ({ ...place, activityCategory: "nature" as const }));
    const description = buildActivityListDescription(nature, "nature");
    expect(description).toContain(" 속초해변 등의");
    expect(description).not.toContain("화진포해변");
  });
});

describe("장소 상세 경로의 지역", () => {
  it("고성 장소의 경로는 고성 목록과 고성 분류를 거치고, 속초 장소는 지금처럼 속초다", () => {
    const goseongItems = buildPlaceBreadcrumbStructuredData({ ...goseong, activityCategory: "nature" }, "https://sokchomoa.com").itemListElement;
    expect(goseongItems.slice(1, 3).map((item) => [item.name, item.item])).toEqual([
      ["고성 가볼만한 곳", "https://sokchomoa.com/places?region=goseong"],
      ["고성 자연·명소", "https://sokchomoa.com/places/category/nature?region=goseong"],
    ]);
    const sokchoItems = buildPlaceBreadcrumbStructuredData({ ...sokcho, activityCategory: "nature" }, "https://sokchomoa.com").itemListElement;
    expect(sokchoItems.slice(1, 3).map((item) => [item.name, item.item])).toEqual([
      ["속초 가볼만한 곳", "https://sokchomoa.com/places"],
      ["속초 자연·명소", "https://sokchomoa.com/places/category/nature"],
    ]);
  });
});

// 행사 분야 목록(features/events/topic-seo.ts)과 같은 모양이다. 검색 결과에 "속초모아 › 속초 가볼만한 곳 › 속초 자연·명소" 경로가 보이게 한다(2026-11-24).
describe("가볼만한 곳 목록의 구조화 데이터", () => {
  const nature = [sokcho].map((place) => ({ ...place, activityCategory: "nature" as const }));

  it("전체 목록은 CollectionPage와 경로를 같은 대표 주소로 잇는다", () => {
    expect(buildActivityListStructuredData(nature, "https://sokchomoa.com")["@graph"]).toEqual([
      expect.objectContaining({
        "@type": "CollectionPage",
        url: "https://sokchomoa.com/places",
        name: "속초 가볼만한 곳",
        breadcrumb: { "@id": "https://sokchomoa.com/places#breadcrumb" },
      }),
      expect.objectContaining({
        "@type": "BreadcrumbList",
        "@id": "https://sokchomoa.com/places#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "속초모아", item: "https://sokchomoa.com/" },
          { "@type": "ListItem", position: 2, name: "속초 가볼만한 곳", item: "https://sokchomoa.com/places" },
        ],
      }),
    ]);
  });

  it("분류 목록은 전체 목록을 거쳐 그 분류로 이어지고, 장소 상세의 경로와 이름이 같다", () => {
    const [page, breadcrumb] = buildActivityListStructuredData(nature, "https://sokchomoa.com", "nature")["@graph"];
    expect(page).toMatchObject({ url: "https://sokchomoa.com/places/category/nature", name: "속초 자연·명소" });
    expect(breadcrumb).toMatchObject({
      itemListElement: [
        { position: 1, name: "속초모아", item: "https://sokchomoa.com/" },
        { position: 2, name: "속초 가볼만한 곳", item: "https://sokchomoa.com/places" },
        { position: 3, name: "속초 자연·명소", item: "https://sokchomoa.com/places/category/nature" },
      ],
    });
  });
});

describe("검색 결과의 지역", () => {
  it("결과에 있는 지역만 받고, 없는 지역이나 지역이 하나뿐이면 전체(null)로 본다", () => {
    expect(resolveSearchRegion("goseong", ["sokcho", "goseong"])).toBe("goseong");
    expect(resolveSearchRegion("goseong", ["sokcho", "yangyang"])).toBeNull();
    expect(resolveSearchRegion("sokcho", ["sokcho"])).toBeNull();
    expect(resolveSearchRegion("all", ["sokcho", "goseong"])).toBeNull();
    expect(resolveSearchRegion(undefined, ["sokcho", "goseong"])).toBeNull();
  });
});

function withPrice(place: Place, hours: string | null) {
  return { ...place, activityCategory: "nature" as const, priceSummary: "무료", hoursSummary: hours };
}

describe("분류 페이지 검색 제목", () => {
  it("그 분류의 속초 장소 절반 이상에 있는 항목만 약속하고, 위치는 늘 넣는다", () => {
    const nature = [withPrice(sokcho, null), withPrice(makePlace({ id: "9", slug: "s2", address: "강원특별자치도 속초시 1" }), null), withPrice(goseong, "09:00~18:00")];
    expect(buildActivityCategorySeoTitle(nature, "nature")).toBe("속초 자연·명소 요금·위치 안내");
    const exhibition = [{ ...sokcho, activityCategory: "exhibition" as const, priceSummary: "3,000원", hoursSummary: "09:00~18:00" }];
    expect(buildActivityCategorySeoTitle(exhibition, "exhibition")).toBe("속초 전시·박물관 운영시간·요금·위치 안내");
  });
});
