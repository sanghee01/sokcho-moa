import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://sokcho-moa.vercel.app" }),
}));

vi.mock("@/lib/data/events", () => ({
  getAllPublicEvents: vi.fn(async () => [
    {
      slug: "summer-festival",
      category: "festival",
      isDemo: false,
      isFeatured: true,
      imageUrl: "https://images.example/summer.webp",
      lastVerifiedAt: "2026-08-03T12:00:00+09:00",
      publishedAt: "2026-08-01T12:00:00+09:00",
      eventStartAt: "2026-08-22T18:00:00+09:00",
    },
    {
      slug: "sample-event",
      category: "festival",
      isDemo: true,
      isFeatured: false,
      imageUrl: "https://images.example/sample.webp",
      lastVerifiedAt: "2026-08-04T12:00:00+09:00",
      publishedAt: "2026-08-04T12:00:00+09:00",
      eventStartAt: "2026-08-30T18:00:00+09:00",
    },
    {
      slug: "local-image-event",
      category: "performance",
      isDemo: false,
      isFeatured: false,
      imageUrl: "/event-images/local-poster.webp",
      lastVerifiedAt: "2026-08-02T12:00:00+09:00",
      publishedAt: "2026-08-01T12:00:00+09:00",
      eventStartAt: "2026-08-24T18:00:00+09:00",
    },
  ]),
}));

import sitemap from "@/app/sitemap";

describe("SEO sitemap", () => {
  it("실제 행사와 동일 출처 대표 이미지만 포함하고 실제 수정일을 사용한다", async () => {
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
    expect(entries.some((entry) => entry.url.includes("sample-event"))).toBe(false);
  });
});
