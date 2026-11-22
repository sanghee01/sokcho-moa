import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import activityCatalog from "@/data/activity-places.json";
import attractionCatalog from "@/data/attractions.json";
import { MAP_REGION_BOUNDS } from "@/features/map/model/map-pins";
import { isActivityCategory, isActivityTag, isOperationStatus } from "@/features/places/model/activity";
import { getPlaceThumbnailUrl } from "@/features/places/model/place-photo";
import { getPlaceRegion } from "@/features/places/model/region";
import { slugPattern } from "@/lib/slug";
import { isHttpUrl } from "@/lib/url";

const places = activityCatalog.places;
const catalogSlugs = new Set(attractionCatalog.accepted.map((place) => place.slug));
const catalogBySlug = new Map(attractionCatalog.accepted.map((place) => [place.slug, place]));

/** 명소 원본을 덮어쓰는 장소는 비운 칸에 원본 값이 쓰인다(scripts/generate-place-assets.mjs의 mergePlaces와 같은 규칙). */
function resolvedValue<K extends "latitude" | "longitude" | "address" | "summary">(place: (typeof places)[number], key: K) {
  const own = (place as Partial<Record<K, unknown>>)[key];
  if (own !== undefined && own !== null) return own;
  return place.catalogSlug ? catalogBySlug.get(place.catalogSlug)?.[key] : undefined;
}
// 공개 범위는 속초·고성·양양이다(2026-11-21 속초시로 시작, 2026-11-22 사용자 결정으로 고성·양양 명소를 더함).

// 즐길거리 원본(data/activity-places.json)이 DB 제약과 화면이 기대하는 모양을 지키는지 확인한다.
describe("즐길거리 원본 데이터", () => {
  it("slug는 주소에 쓸 수 있는 모양이고 겹치지 않는다", () => {
    const slugs = places.map((place) => place.slug);
    expect(slugs.every((slug) => slugPattern.test(slug))).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
    // 명소 원본에 남는 slug(덮어쓰지 않는 장소)와도 겹치면 안 된다.
    const replaced = new Set(places.map((place) => place.catalogSlug).filter(Boolean));
    const remaining = [...catalogSlugs].filter((slug) => !replaced.has(slug));
    expect(slugs.filter((slug) => remaining.includes(slug))).toEqual([]);
  });

  it("명소 원본을 가리키는 catalogSlug는 실제로 있고 한 번씩만 쓴다", () => {
    const referenced = places.map((place) => place.catalogSlug).filter((slug) => slug !== null);
    expect(referenced.filter((slug) => !catalogSlugs.has(slug))).toEqual([]);
    expect(new Set(referenced).size).toBe(referenced.length);
  });

  it("분류·태그·운영 상태는 DB가 받는 값이다", () => {
    for (const place of places) {
      expect(isActivityCategory(place.activityCategory), place.slug).toBe(true);
      expect(place.tags.every(isActivityTag), place.slug).toBe(true);
      expect(isOperationStatus(place.operationStatus), place.slug).toBe(true);
      // 모든 장소에 확인일이 있다. 자연·명소도 2026-11-21에 소개·운영 정보를 조사해 채웠다(그 전에는 비어 있었음).
      expect(place.verifiedOn, place.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("좌표는 지도 범위(속초·고성·양양) 안이고, 모든 장소가 지역 칩의 한 지역에 들어간다", () => {
    for (const place of places) {
      const latitude = Number(resolvedValue(place, "latitude"));
      const longitude = Number(resolvedValue(place, "longitude"));
      expect(latitude, place.slug).toBeGreaterThanOrEqual(MAP_REGION_BOUNDS.south);
      expect(latitude, place.slug).toBeLessThanOrEqual(MAP_REGION_BOUNDS.north);
      expect(longitude, place.slug).toBeGreaterThanOrEqual(MAP_REGION_BOUNDS.west);
      expect(longitude, place.slug).toBeLessThanOrEqual(MAP_REGION_BOUNDS.east);
      const address = resolvedValue(place, "address");
      const id = "id" in place && typeof place.id === "string" ? place.id : catalogBySlug.get(place.catalogSlug ?? "")?.id ?? "";
      expect(getPlaceRegion({ id, address: typeof address === "string" ? address : null }), place.slug).not.toBeNull();
    }
  });

  it("밖으로 나가는 주소는 http(s)이고, 새 장소에는 화면에 필요한 값이 있다", () => {
    for (const place of places) {
      for (const url of ["officialUrl" in place ? place.officialUrl : null, place.bookingUrl]) {
        if (typeof url === "string") expect(isHttpUrl(url), `${place.slug}: ${url}`).toBe(true);
      }
      // 한 줄 소개와 긴 소개(description)는 모든 장소에 있어야 한다. 자연·명소에 소개가 없어 다른 장소보다 정보가 부족했다(2026-11-21 사용자 피드백).
      expect(String(resolvedValue(place, "summary") ?? "").length, place.slug).toBeGreaterThan(0);
      expect(place.description?.length ?? 0, place.slug).toBeGreaterThan(0);
      // "속초시 일원"처럼 어디인지 알 수 없는 주소를 쓰지 않는다.
      expect(String(resolvedValue(place, "address")), place.slug).not.toContain("일원");
      if (place.catalogSlug === null) {
        const added = place as typeof place & { id?: string; name?: string; category?: string };
        expect(added.id, place.slug).toMatch(/^[0-9a-f-]{36}$/);
        expect(added.name?.length ?? 0, place.slug).toBeGreaterThan(0);
        expect(added.category?.length ?? 0, place.slug).toBeGreaterThan(0);
      }
    }
  });

  it("사진을 싣는 장소는 출처·원본 페이지·출처 기록과 파일이 모두 있다", () => {
    // 공개 라이선스 사진은 재게시·상업 이용·변경이 허용된 것만 쓴다. 새 라이선스를 쓰려면 조건을 확인한 뒤 여기에 더한다.
    // 공식 누리집 사진(kind: "official")은 라이선스 대신 원본 주소를 남긴다. 요청이 오면 바로 빼려고서다(2026-11-21 사용자 결정).
    const allowedLicense = /^(CC0|Public domain|CC BY(-SA)? [234]\.0|KOGL Type 1)$/;
    const withPhoto = places.filter((place) => "imageUrl" in place && place.imageUrl);
    expect(withPhoto.length).toBeGreaterThan(0);
    for (const place of withPhoto) {
      const photo = place as typeof place & { imageUrl: string; imageCredit?: string; imageSourceUrl?: string; imageAlt?: string; imageProvenance?: { kind: string; license: string | null; author: string; originalUrl: string } };
      expect(photo.imageUrl, place.slug).toBe(`/places/${place.slug}.webp`);
      expect(photo.imageCredit?.length ?? 0, place.slug).toBeGreaterThan(0);
      expect(isHttpUrl(photo.imageSourceUrl ?? ""), place.slug).toBe(true);
      expect(photo.imageAlt?.length ?? 0, place.slug).toBeGreaterThan(0);
      expect(["open-license", "official"], place.slug).toContain(photo.imageProvenance?.kind);
      expect(isHttpUrl(photo.imageProvenance?.originalUrl ?? ""), place.slug).toBe(true);
      // 출처 문구에 만든 사람(공식 사진은 게시한 곳)이 실제로 들어 있어야 한다.
      expect(photo.imageCredit, place.slug).toContain(photo.imageProvenance?.author);
      if (photo.imageProvenance?.kind === "open-license") {
        expect(photo.imageProvenance.license ?? "", place.slug).toMatch(allowedLicense);
        expect(photo.imageCredit, place.slug).toContain(photo.imageProvenance.license);
      }
      const thumbnailUrl = getPlaceThumbnailUrl(photo.imageUrl);
      expect(thumbnailUrl, place.slug).not.toBeNull();
      expect(existsSync(path.join(process.cwd(), "public", photo.imageUrl)), `${place.slug} 사진 파일`).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", thumbnailUrl ?? "")), `${place.slug} 썸네일 파일`).toBe(true);
    }
  });

  it("방문자에게 보이는 글에 조사 메모가 섞이지 않는다", () => {
    // statusNote·운영시간·요금에는 "네이버 플레이스 표기" 같은 출처 메모나 내부 값 이름이 들어가면 안 된다.
    const internal = /표기|seasonal_closed|temporarily_closed|조사일|확인하지 못/;
    for (const place of places) {
      for (const text of [place.statusNote, place.hoursSummary, place.closedSummary, place.priceSummary, place.parkingSummary, ...place.cautions]) {
        if (text !== null) expect(internal.test(text), `${place.slug}: ${text}`).toBe(false);
      }
    }
  });
});
