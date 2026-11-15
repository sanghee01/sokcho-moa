import { describe, expect, it } from "vitest";
import type { Event } from "@/features/events/model/event";
import { venues } from "@/features/events/model/venue";
import {
  buildEventBreadcrumbStructuredData,
  buildEventSeoDescription,
  buildEventStructuredData,
  eventOfferPrice,
} from "@/features/events/seo";

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
  scheduleMode: "continuous",
  occurrences: [],
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
  viewCount: 0,
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
    // 장소 사전에 있는 시설이면 주소가 채워지므로(2026-11-15), 사전에 없는 장소 이름으로 "주소 없음"을 확인한다.
    const result = buildEventStructuredData({
      ...event,
      locationName: "설악동 C지구 소공원",
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

  it("저장된 주소가 없어도 장소 사전에 있는 시설이면 그 주소로 Event를 만든다", () => {
    const [venue] = venues;
    const result = buildEventStructuredData({
      ...event,
      address: null,
      locationName: `${venue.name} 2층`,
    }, "https://sokcho-moa.vercel.app");

    expect(result?.location).toMatchObject({
      name: `${venue.name} 2층`,
      address: { "@type": "PostalAddress", streetAddress: venue.address, addressCountry: "KR" },
    });
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

  it("만·천 단위로 쓴 요금 문구도 원화 금액으로 읽는다", () => {
    expect(eventOfferPrice({ isFree: false, priceText: "2만원 (설악권 주민 50% 할인)" })).toBe(20_000);
    expect(eventOfferPrice({ isFree: false, priceText: "1만 5천원" })).toBe(15_000);
    expect(eventOfferPrice({ isFree: false, priceText: "1만5000원" })).toBe(15_000);
    expect(eventOfferPrice({ isFree: false, priceText: "성인 1만원 · 어린이 5천원" })).toBe(5_000);
    expect(eventOfferPrice({ isFree: false, priceText: "선착순 1만 명, 입장료 3,000원" })).toBe(3_000);
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

  // DB는 시각을 UTC(+00:00)로 돌려준다. 그대로 쓰면 서울 자정 시작 행사가 글자상 전날로 읽힌다(2026-11-15).
  it("행사 시각을 서울 시간대(+09:00)로 쓴다", () => {
    const result = buildEventStructuredData({
      ...event,
      eventStartAt: "2026-08-01T10:00:00+00:00",
      eventEndAt: "2026-08-01T12:30:00+00:00",
      applicationStartAt: "2026-07-01T00:00:00+00:00",
    }, "https://sokcho-moa.vercel.app", new Date("2026-07-28T00:00:00+09:00"));

    expect(result).toMatchObject({
      startDate: "2026-08-01T19:00:00+09:00",
      endDate: "2026-08-01T21:30:00+09:00",
      offers: { validFrom: "2026-07-01T09:00:00+09:00" },
    });
  });

  // 시각 없는 행사는 서울 00:00 시작·23:59 종료로 저장된다. Google은 시각을 모르면 날짜만 쓰라고 한다(2026-11-15).
  it("서울 00:00 시작과 23:59 종료는 시각 없이 날짜만 쓴다", () => {
    const result = buildEventStructuredData({
      ...event,
      eventStartAt: "2026-11-05T15:00:00+00:00",
      eventEndAt: "2026-11-15T14:59:59.999+00:00",
    }, "https://sokcho-moa.vercel.app");

    expect(result).toMatchObject({ startDate: "2026-11-06", endDate: "2026-11-15" });
  });

  it("날짜만 쓸 때도 월말·연말을 넘는 서울 날짜를 그대로 쓴다", () => {
    const monthEnd = buildEventStructuredData({
      ...event,
      eventStartAt: "2026-10-31T15:00:00+00:00",
      eventEndAt: "2026-12-31T14:59:00+00:00",
    }, "https://sokcho-moa.vercel.app");
    const yearEnd = buildEventStructuredData({
      ...event,
      eventStartAt: "2026-12-31T15:00:00+00:00",
      eventEndAt: "2027-01-01T14:59:00+00:00",
    }, "https://sokcho-moa.vercel.app");

    expect(monthEnd).toMatchObject({ startDate: "2026-11-01", endDate: "2026-12-31" });
    expect(yearEnd).toMatchObject({ startDate: "2027-01-01", endDate: "2027-01-01" });
  });

  it("시작은 날짜만이고 종료 시각이 정해진 행사는 종료 시각을 남긴다", () => {
    const result = buildEventStructuredData({
      ...event,
      eventStartAt: "2026-10-15T15:00:00+00:00",
      eventEndAt: "2026-10-18T12:00:00+00:00",
    }, "https://sokcho-moa.vercel.app");

    expect(result).toMatchObject({ startDate: "2026-10-16", endDate: "2026-10-18T21:00:00+09:00" });
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
