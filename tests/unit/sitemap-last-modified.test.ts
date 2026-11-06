import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://sokcho-moa.vercel.app" }),
}));

// 정보를 먼저 확인(lastVerifiedAt)하고 나중에 공개(publishedAt)한 행사.
vi.mock("@/features/events/queries", () => ({
  getAllPublicEvents: vi.fn(async () => [{
    slug: "verified-before-publish",
    category: "festival",
    isFeatured: false,
    imageUrl: null,
    lastVerifiedAt: "2026-11-01T12:00:00+09:00",
    publishedAt: "2026-11-05T12:00:00+09:00",
    eventStartAt: "2026-12-01T18:00:00+09:00",
  }]),
}));

import sitemap from "@/app/sitemap";

describe("sitemap lastModified", () => {
  it("확인 시각과 공개 시각 중 더 늦은 값을 쓴다(공개 전 날짜로 보이지 않게)", async () => {
    const entry = (await sitemap()).find((item) => item.url.endsWith("/events/verified-before-publish"));
    expect(entry?.lastModified).toEqual(new Date("2026-11-05T12:00:00+09:00"));
  });
});
