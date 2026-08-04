import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/events", () => ({
  getAllPublicEvents: vi.fn(async () => []),
  getPublicPlaces: vi.fn(async () => []),
  getRelatedEvents: vi.fn(() => []),
  getPublicEventBySlug: vi.fn(async (slug: string) => ({
    slug,
    title: "2026 속초 여름축제",
    eventStartAt: "2026-08-22T18:00:00+09:00",
    eventEndAt: "2026-08-23T22:00:00+09:00",
    locationName: "속초해수욕장",
    summary: "바다와 음악을 함께 즐기는 속초의 여름 축제입니다.",
    description: null,
    imageUrl: slug === "no-image" ? "   " : "https://images.example/sokcho-festival.webp",
  })),
}));

import { generateMetadata } from "@/app/events/[slug]/page";

describe("event page metadata", () => {
  it("행사별 canonical, 사이트명, 대표 이미지와 큰 미리보기 허용값을 함께 제공한다", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "sokcho-summer-festival" }) });

    expect(metadata).toMatchObject({
      title: "2026 속초 여름축제 일정·장소·신청 안내",
      description: expect.stringContaining("속초해수욕장"),
      alternates: { canonical: "/events/sokcho-summer-festival" },
      robots: { googleBot: { "max-image-preview": "large" } },
      openGraph: {
        url: "/events/sokcho-summer-festival",
        siteName: "속초모아",
        title: "2026 속초 여름축제",
        images: [{
          url: "https://images.example/sokcho-festival.webp",
          alt: "2026 속초 여름축제 행사 대표 이미지",
        }],
      },
    });
  });

  it("공백 이미지 URL을 홈페이지나 깨진 썸네일로 해석하지 않는다", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "no-image" }) });

    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });
});
