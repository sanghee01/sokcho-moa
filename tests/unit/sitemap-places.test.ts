import { describe, expect, it, vi } from "vitest";

// 'use cache' 함수 안의 cacheLife·cacheTag는 Next.js 밖(vitest)에서 부르면 오류를 낸다. 저장 기간은 이 test가 보는 값이 아니라 아무 일도 하지 않게 둔다(2026-11-24).
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://sokcho-moa.vercel.app" }),
}));

vi.mock("@/features/events/queries", () => ({
  getAllPublicEvents: vi.fn(async () => []),
}));

const mocks = vi.hoisted(() => ({ getPublicPlaces: vi.fn() }));
vi.mock("@/features/places/queries", () => ({ getPublicPlaces: mocks.getPublicPlaces }));

import sitemap from "@/app/sitemap";

function place(slug: string, overrides: Record<string, unknown> = {}) {
  return { slug, name: slug, activityCategory: "exhibition", operationStatus: "open", verifiedOn: null, ...overrides };
}

// 즐길거리는 분류가 있고 운영을 끝내지 않은 장소만 검색엔진에 알린다.
describe("sitemap의 즐길거리", () => {
  it("목록, 장소가 있는 분류, 장소 상세를 넣고 확인일을 수정일로 쓴다", async () => {
    mocks.getPublicPlaces.mockResolvedValue([
      place("museum-x", { verifiedOn: "2026-11-21" }),
      place("waterpia", { activityCategory: "water" }),
      place("closed-tower", { activityCategory: "view", operationStatus: "closed" }),
      place("beach", { activityCategory: null }),
    ]);
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://sokcho-moa.vercel.app/places");
    expect(urls).toContain("https://sokcho-moa.vercel.app/places/category/water");
    expect(urls).toContain("https://sokcho-moa.vercel.app/places/category/exhibition");
    expect(urls).toContain("https://sokcho-moa.vercel.app/places/museum-x");
    expect(urls).not.toContain("https://sokcho-moa.vercel.app/places/category/view");
    expect(urls).not.toContain("https://sokcho-moa.vercel.app/places/closed-tower");
    expect(urls).not.toContain("https://sokcho-moa.vercel.app/places/beach");

    const museum = entries.find((entry) => entry.url.endsWith("/places/museum-x"));
    expect(museum?.lastModified).toEqual(new Date("2026-11-20T15:00:00.000Z"));
  });

  it("즐길거리 장소가 없으면 목록 주소도 넣지 않는다", async () => {
    mocks.getPublicPlaces.mockResolvedValue([place("beach", { activityCategory: null })]);
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/places"))).toBe(false);
  });
});
