import { describe, expect, it } from "vitest";
import type { Event } from "@/lib/domain/event";
import {
  buildEventBreadcrumbStructuredData,
  buildEventSeoDescription,
  buildEventStructuredData,
  eventOfferPrice,
} from "@/lib/seo/event-structured-data";

const event: Event = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "summer-concert",
  title: "속초 여름 음악회",
  summary: "바닷가에서 열리는 여름 음악회",
  description: null,
  category: "performance",
  audiences: ["all"],
  eventStartAt: "2026-08-01T19:00:00+09:00",
  eventEndAt: "2026-08-01T21:00:00+09:00",
  operatingHours: null,
  applicationStartAt: "2026-07-01T09:00:00+09:00",
  applicationEndAt: null,
  locationName: "속초문화예술회관",
  address: "강원특별자치도 속초시 번영로 155",
  latitude: 38.207,
  longitude: 128.591,
  locationSourceUrl: null,
  locationVerifiedAt: null,
  priceText: "무료",
  isFree: true,
  performers: [
    { name: "홍길동", type: "Person" },
    { name: "설악 앙상블", type: "PerformingGroup" },
  ],
  organizer: "속초문화관광재단",
  organizerUrl: "https://example.org",
  contact: null,
  officialUrl: null,
  applicationUrl: "https://booking.example.org/summer-concert",
  imageUrl: "/images/summer-concert.webp",
  sourceName: "속초문화관광재단",
  sourceUrl: "https://example.org/events/summer-concert",
  reviewStatus: "published",
  isFeatured: true,
  isDemo: false,
  lastVerifiedAt: "2026-07-20T00:00:00+09:00",
  publishedAt: "2026-07-20T00:00:00+09:00",
};

describe("event structured data", () => {
  it("검색 결과에 필요한 검증된 행사 세부 정보를 출력한다", () => {
    const result = buildEventStructuredData(
      event,
      "https://sokcho-moa.vercel.app",
      new Date("2026-07-28T00:00:00+09:00"),
    );
    if (!result) throw new Error("주소가 있는 오프라인 행사의 구조화 데이터가 누락되었습니다.");

    expect(result.url).toBe("https://sokcho-moa.vercel.app/events/summer-concert");
    expect(result).toMatchObject({
      "@id": "https://sokcho-moa.vercel.app/events/summer-concert#event",
      mainEntityOfPage: "https://sokcho-moa.vercel.app/events/summer-concert",
      inLanguage: "ko-KR",
    });
    expect(result.location).toEqual({
      "@type": "Place",
      name: "속초문화예술회관",
      address: {
        "@type": "PostalAddress",
        streetAddress: "강원특별자치도 속초시 번영로 155",
        addressCountry: "KR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 38.207,
        longitude: 128.591,
      },
    });
    expect(result.image).toEqual(["https://sokcho-moa.vercel.app/images/summer-concert.webp"]);
    expect(result.offers).toEqual({
      "@type": "Offer",
      url: "https://booking.example.org/summer-concert",
      price: 0,
      priceCurrency: "KRW",
      validFrom: "2026-07-01T09:00:00+09:00",
    });
    expect(result.performer).toEqual([
      { "@type": "Person", name: "홍길동" },
      { "@type": "PerformingGroup", name: "설악 앙상블" },
    ]);
    expect(result.organizer).toEqual({
      "@type": "Organization",
      name: "속초문화관광재단",
      url: "https://example.org",
    });
    expect(buildEventSeoDescription(event)).toContain("속초 여름 음악회 일정 2026.08.01");
  });

  it("Google 필수 장소 정보가 없으면 Event 리치 결과 데이터를 만들지 않는다", () => {
    const result = buildEventStructuredData({
      ...event,
      address: null,
      latitude: null,
      longitude: null,
      priceText: null,
      isFree: null,
      performers: [],
      organizer: null,
      organizerUrl: null,
      imageUrl: null,
    }, "https://sokcho-moa.vercel.app");

    expect(result).toBeNull();
  });

  it("상세 주소가 있으면 확인되지 않은 장소명을 꾸며내지 않는다", () => {
    const result = buildEventStructuredData({
      ...event,
      locationName: null,
    }, "https://sokcho-moa.vercel.app");

    expect(result?.location).toEqual({
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: "강원특별자치도 속초시 번영로 155",
        addressCountry: "KR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 38.207,
        longitude: 128.591,
      },
    });
  });

  it("확인되지 않은 권장 정보는 임의로 만들지 않는다", () => {
    const result = buildEventStructuredData({
      ...event,
      applicationUrl: null,
      priceText: null,
      isFree: null,
      performers: [],
      organizer: null,
      organizerUrl: null,
      imageUrl: null,
    }, "https://sokcho-moa.vercel.app");

    expect(result).not.toHaveProperty("offers");
    expect(result).not.toHaveProperty("performer");
    expect(result).not.toHaveProperty("image");
    expect(result).not.toHaveProperty("organizer");
  });

  it("유료 요금 문구에서는 가장 낮은 원화 금액을 사용한다", () => {
    expect(eventOfferPrice({ isFree: false, priceText: "성인 10,000원 · 청소년 5,000원" })).toBe(5_000);
    expect(eventOfferPrice({ isFree: null, priceText: "무료(사전 신청)" })).toBe(0);
    expect(eventOfferPrice({ isFree: false, priceText: "요금은 원문 확인" })).toBeNull();
  });

  it("직접 신청 URL이 없으면 일반 출처 페이지를 예매 Offer로 표시하지 않는다", () => {
    const result = buildEventStructuredData({
      ...event,
      applicationUrl: null,
      priceText: "10,000원",
      isFree: false,
    }, "https://sokcho-moa.vercel.app");

    expect(result).not.toHaveProperty("offers");
  });

  it("판매 시작일은 실제 값만 표시하고 재고 상태를 신청 기간으로 추정하지 않는다", () => {
    const upcoming = buildEventStructuredData(
      event,
      "https://sokcho-moa.vercel.app",
      new Date("2026-06-20T00:00:00+09:00"),
    );
    const open = buildEventStructuredData(
      event,
      "https://sokcho-moa.vercel.app",
      new Date("2026-07-20T00:00:00+09:00"),
    );
    const unknownStart = buildEventStructuredData({
      ...event,
      applicationStartAt: null,
    }, "https://sokcho-moa.vercel.app", new Date("2026-07-20T00:00:00+09:00"));

    expect(upcoming?.offers).toMatchObject({
      validFrom: "2026-07-01T09:00:00+09:00",
    });
    expect(upcoming?.offers).not.toHaveProperty("availability");
    expect(open?.offers).not.toHaveProperty("availability");
    expect(unknownStart?.offers).not.toHaveProperty("validFrom");
    expect(unknownStart?.offers).not.toHaveProperty("availability");
  });

  it("신청이 끝났거나 행사가 종료된 예매 링크는 Offer로 노출하지 않는다", () => {
    const closedApplication = buildEventStructuredData({
      ...event,
      applicationEndAt: "2026-07-10T18:00:00+09:00",
    }, "https://sokcho-moa.vercel.app", new Date("2026-07-20T00:00:00+09:00"));
    const endedEvent = buildEventStructuredData(
      event,
      "https://sokcho-moa.vercel.app",
      new Date("2026-08-02T00:00:00+09:00"),
    );

    expect(closedApplication).not.toHaveProperty("offers");
    expect(endedEvent).not.toHaveProperty("offers");
    expect(endedEvent).toMatchObject({
      eventStatus: "https://schema.org/EventScheduled",
    });
  });

  it("행사 상세 경로를 브랜드와 주제 계층에 연결한다", () => {
    const result = buildEventBreadcrumbStructuredData(event, "https://sokcho-moa.vercel.app");

    expect(result.itemListElement).toEqual([
      expect.objectContaining({ position: 1, name: "속초모아" }),
      expect.objectContaining({
        position: 2,
        name: "속초 공연",
        item: "https://sokcho-moa.vercel.app/topics/performance",
      }),
      expect.objectContaining({
        position: 3,
        name: "속초 여름 음악회",
        item: "https://sokcho-moa.vercel.app/events/summer-concert",
      }),
    ]);
  });
});
