import { describe, expect, it, vi } from "vitest";

// cacheComponents는 generateStaticParams가 빈 배열이면 빌드를 멈춘다(next/dist/build/static-paths/app.js의 empty-generate-static-params).
// 공개한 공지·장소·행사가 하나도 없어도 배포가 되도록, 빈 목록이면 없는 주소 하나를 대신 돌려준다. 그 주소는 페이지가 404로 그린다(2026-11-24).

vi.mock("@/features/events/queries", () => ({
  getAllPublicEvents: vi.fn(async () => []),
  getPublicEventBySlug: vi.fn(async () => null),
}));
vi.mock("@/features/places/queries", () => ({
  getPublicPlaces: vi.fn(async () => []),
}));
vi.mock("@/features/notices/queries", () => ({
  getPublicNotices: vi.fn(async () => []),
}));

import { generateStaticParams as generateEventParams } from "@/app/events/[slug]/page";
import { generateStaticParams as generateNoticeParams } from "@/app/notices/[id]/page";
import { generateStaticParams as generatePlaceCategoryParams } from "@/app/places/(list)/category/[category]/page";
import { generateStaticParams as generatePlaceParams } from "@/app/places/[slug]/page";

describe("공개한 항목이 하나도 없을 때의 generateStaticParams", () => {
  it.each([
    ["행사 상세", generateEventParams],
    ["공지 글", generateNoticeParams],
    ["가볼만한 곳 분류", generatePlaceCategoryParams],
    ["가볼만한 곳 상세", generatePlaceParams],
  ])("%s: 빈 배열 대신 404로 그릴 주소 하나를 돌려준다", async (_name, generate) => {
    expect(await generate()).toHaveLength(1);
  });
});
