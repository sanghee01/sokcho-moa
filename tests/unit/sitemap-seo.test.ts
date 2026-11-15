import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://sokcho-moa.vercel.app" }),
}));

vi.mock("@/features/events/queries", () => ({
  getAllPublicEvents: vi.fn(async () => [
    {
      slug: "summer-festival",
      category: "festival",
      isFeatured: true,
      reviewStatus: "published",
      imageUrl: "https://images.example/summer.webp",
      lastVerifiedAt: "2026-08-03T12:00:00+09:00",
      publishedAt: "2026-08-01T12:00:00+09:00",
      eventStartAt: "2026-08-22T18:00:00+09:00",
    },
    {
      slug: "local-image-event",
      category: "performance",
      isFeatured: false,
      reviewStatus: "published",
      imageUrl: "/event-images/local-poster.webp",
      lastVerifiedAt: "2026-08-02T12:00:00+09:00",
      publishedAt: "2026-08-01T12:00:00+09:00",
      eventStartAt: "2026-08-24T18:00:00+09:00",
    },
  ]),
}));

import sitemap from "@/app/sitemap";

describe("SEO sitemap", () => {
  it("공개 행사와 동일 출처 대표 이미지만 포함하고 실제 수정일을 사용한다", async () => {
    const entries = await sitemap();
    const home = entries.find((entry) => entry.url === "https://sokcho-moa.vercel.app");
    const externalImageEvent = entries.find((entry) => entry.url.endsWith("/events/summer-festival"));
    const localImageEvent = entries.find((entry) => entry.url.endsWith("/events/local-image-event"));

    expect(home).toMatchObject({
      images: ["https://sokcho-moa.vercel.app/icon.jpeg"],
      lastModified: new Date("2026-08-03T12:00:00+09:00"),
    });
    expect(externalImageEvent).toMatchObject({
      lastModified: new Date("2026-08-03T12:00:00+09:00"),
    });
    expect(externalImageEvent).not.toHaveProperty("images");
    expect(localImageEvent).toMatchObject({
      images: ["https://sokcho-moa.vercel.app/event-images/local-poster.webp"],
      lastModified: new Date("2026-08-02T12:00:00+09:00"),
    });
  });

  it("이번 달과 다음 달 월별 행사 페이지만 넣고, 그 달 행사의 최신 수정일을 쓴다", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-10T12:00:00+09:00"));
    try {
      const monthEntries = (await sitemap()).filter((entry) => entry.url.includes("/months/"));

      expect(monthEntries.map((entry) => entry.url)).toEqual([
        "https://sokcho-moa.vercel.app/months/2026-08",
        "https://sokcho-moa.vercel.app/months/2026-09",
      ]);
      expect(monthEntries[0]).toMatchObject({ lastModified: new Date("2026-08-03T12:00:00+09:00") });
      expect(monthEntries[1]).not.toHaveProperty("lastModified");
    } finally {
      vi.useRealTimers();
    }
  });
});
