import { describe, expect, it } from "vitest";
import { placeFormSchema } from "@/features/places/admin/schemas";
import { getPlaceThumbnailUrl, selectPlacePhoto } from "@/features/places/model/place-photo";

const base = { name: "속초 엑스포타워", imageUrl: "/places/expo-tower.webp", imageCredit: "사진: 홍길동, CC BY-SA 4.0 (위키미디어 공용)", imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg", imageAlt: "청초호 옆에 선 엑스포타워 전경" };

// 사진은 재게시 조건이 출처 표시인 것만 쓴다. 출처 없는 사진은 화면에 싣지 않는다.
describe("selectPlacePhoto", () => {
  it("사진과 출처가 있으면 화면용 사진과 썸네일 경로를 돌려준다", () => {
    expect(selectPlacePhoto(base)).toEqual({
      url: "/places/expo-tower.webp",
      thumbnailUrl: "/places/expo-tower-thumb.webp",
      credit: base.imageCredit,
      sourceUrl: base.imageSourceUrl,
      alt: base.imageAlt,
    });
  });

  it("출처 문구가 없으면 사진을 싣지 않는다", () => {
    expect(selectPlacePhoto({ ...base, imageCredit: null })).toBeNull();
    expect(selectPlacePhoto({ ...base, imageCredit: "   " })).toBeNull();
  });

  it("사진 주소가 없으면 null이다", () => {
    expect(selectPlacePhoto({ ...base, imageUrl: null })).toBeNull();
    expect(selectPlacePhoto({ ...base, imageUrl: "" })).toBeNull();
  });

  it("장면 설명이 없으면 이름을 대체 텍스트로 쓴다", () => {
    expect(selectPlacePhoto({ ...base, imageAlt: null })?.alt).toBe("속초 엑스포타워");
  });

  it("바깥 주소의 사진은 썸네일이 없다", () => {
    expect(getPlaceThumbnailUrl("https://example.com/photo.jpg")).toBeNull();
    expect(getPlaceThumbnailUrl("/places/../secret.webp")).toBeNull();
    expect(selectPlacePhoto({ ...base, imageUrl: "https://example.com/photo.jpg" })?.thumbnailUrl).toBeNull();
  });
});

describe("placeFormSchema의 사진 값", () => {
  const input = {
    slug: "expo-tower", name: "엑스포타워", category: "전망", summary: "", address: "", latitude: "38.19", longitude: "128.59",
    imageUrl: "", imageCredit: "", imageSourceUrl: "", imageAlt: "", officialUrl: "", mapUrl: "", isPublished: true,
    activityCategory: "", tags: [], description: "", hoursSummary: "", closedSummary: "", priceSummary: "", phone: "",
    parkingSummary: "", cautions: "", bookingUrl: "", operationStatus: "open", statusNote: "", verifiedOn: "",
  };

  it("우리 사이트 경로와 http(s) 주소를 받는다", () => {
    expect(placeFormSchema.parse({ ...input, imageUrl: "/places/expo-tower.webp", imageCredit: "사진: 홍길동, CC0" }).imageUrl).toBe("/places/expo-tower.webp");
    expect(placeFormSchema.parse({ ...input, imageUrl: "https://example.com/a.jpg", imageCredit: "사진: 홍길동, CC0" }).imageUrl).toBe("https://example.com/a.jpg");
  });

  it("사진이 있는데 출처가 없으면 거부하고 출처 칸의 오류로 알린다", () => {
    const result = placeFormSchema.safeParse({ ...input, imageUrl: "/places/expo-tower.webp" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["imageCredit"]);
  });

  it("다른 폴더 경로와 http가 아닌 주소는 거부한다", () => {
    expect(placeFormSchema.safeParse({ ...input, imageUrl: "/admin/secret.webp", imageCredit: "출처" }).success).toBe(false);
    expect(placeFormSchema.safeParse({ ...input, imageUrl: "javascript:alert(1)", imageCredit: "출처" }).success).toBe(false);
  });

  it("사진이 없으면 출처 없이도 저장된다", () => {
    expect(placeFormSchema.parse(input)).toMatchObject({ imageUrl: null, imageCredit: null });
  });
});
