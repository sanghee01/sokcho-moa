import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/events/queries", () => ({
  getAllPublicEvents: vi.fn(async () => []),
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
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "sokcho-summer-festival" }), searchParams: Promise.resolve({}) });

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

  // 포스터가 없을 때 공유 미리보기가 비지 않도록 사이트 기본 공유 이미지를 쓴다(2026-11-15 사용자 결정).
  // 공백 URL을 홈페이지 주소나 깨진 썸네일로 해석하지 않는 것은 그대로 지킨다.
  it("공백 이미지 URL이면 사이트 기본 공유 이미지를 쓴다", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "no-image" }), searchParams: Promise.resolve({}) });

    expect(metadata.openGraph).toMatchObject({ images: [{ url: "/opengraph-image", width: 1200, height: 630 }] });
    expect(metadata.twitter).toMatchObject({ images: [{ url: "/opengraph-image" }] });
  });
});
