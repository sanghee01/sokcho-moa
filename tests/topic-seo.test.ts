import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/config/env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SITE_URL: "https://sokcho-moa.vercel.app",
  }),
}));

vi.mock("@/lib/data/events", () => ({
  getAllPublicEvents: vi.fn(async () => []),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("@/components/event-search", () => ({
  EventSearch: () => null,
}));

vi.mock("@/components/event-sort", () => ({
  EventSort: () => null,
}));

vi.mock("@/components/transition-link", () => ({
  TransitionLink: () => null,
}));

import { generateMetadata as generateHomeMetadata } from "@/app/page";
import sitemap from "@/app/sitemap";
import {
  dynamicParams,
  generateMetadata as generateTopicMetadata,
  generateStaticParams,
} from "@/app/topics/[topic]/page";
import { EventBrowsePage } from "@/components/event-browse-page";
import { eventCategories } from "@/lib/domain/event";
import {
  eventTopics,
  findEventTopicByCategory,
  findEventTopicBySlug,
} from "@/lib/domain/event-topic";
import { buildTopicStructuredData } from "@/lib/seo/topic-structured-data";

describe("event topic SEO", () => {
  it("모든 공개 주제를 중복 없는 대표 경로로 제공한다", () => {
    expect(dynamicParams).toBe(false);
    expect(eventTopics.map((topic) => topic.category)).toEqual(eventCategories);
    expect(new Set(eventTopics.map((topic) => topic.slug)).size).toBe(eventTopics.length);
    expect(eventTopics.every((topic) => topic.path === `/topics/${topic.slug}`)).toBe(true);
    expect(generateStaticParams()).toEqual(
      eventCategories.map((topic) => ({ topic })),
    );
  });

  it("slug와 기존 category 쿼리를 같은 주제 정의로 연결한다", () => {
    expect(findEventTopicBySlug("festival")).toBe(findEventTopicByCategory("festival"));
    expect(findEventTopicBySlug("unknown")).toBeUndefined();
    expect(findEventTopicByCategory(undefined)).toBeUndefined();
  });

  it("주제 페이지에 고유 metadata와 self-canonical을 제공한다", async () => {
    const metadata = await generateTopicMetadata({
      params: Promise.resolve({ topic: "festival" }),
      searchParams: Promise.resolve({ when: "month" }),
    });

    expect(metadata).toMatchObject({
      title: "속초 축제 일정·기간·장소",
      description: expect.stringContaining("속초"),
      alternates: { canonical: "/topics/festival" },
    });
  });

  it("주제 이동 시 별도 소개 배너 없이 같은 탐색 레이아웃을 유지한다", async () => {
    const topic = findEventTopicBySlug("performance");
    expect(topic).toBeDefined();

    const page = await EventBrowsePage({
      searchParams: Promise.resolve({}),
      topic,
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(
      '<h1 id="topic-page-title" class="sr-only">속초 공연 한눈에 보기</h1>',
    );
    expect(html).not.toContain('aria-label="현재 위치"');
    expect(html).not.toContain("from-teal-900");
  });

  it("없는 주제는 metadata 생성 단계에서 404로 중단한다", async () => {
    await expect(
      generateTopicMetadata({
        params: Promise.resolve({ topic: "unknown" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("기존 category 쿼리는 대응 주제 경로를 canonical로 사용한다", async () => {
    const legacyMetadata = await generateHomeMetadata({
      searchParams: Promise.resolve({ category: "performance", audience: "family" }),
    });
    const homeMetadata = await generateHomeMetadata({
      searchParams: Promise.resolve({ audience: "family" }),
    });

    expect(legacyMetadata).toMatchObject({
      title: "속초 공연 일정·예매 정보",
      alternates: { canonical: "/topics/performance" },
    });
    expect(homeMetadata).toMatchObject({
      title: "속초모아 | 요즘 속초에서 뭐하지?",
      alternates: { canonical: "/" },
    });
  });

  it("CollectionPage와 BreadcrumbList를 같은 대표 URL로 연결한다", () => {
    const topic = findEventTopicBySlug("experience");
    expect(topic).toBeDefined();

    const result = buildTopicStructuredData(
      topic!,
      "https://sokcho-moa.vercel.app",
    );

    expect(result["@graph"]).toEqual([
      expect.objectContaining({
        "@type": "CollectionPage",
        url: "https://sokcho-moa.vercel.app/topics/experience",
        name: "속초 체험 프로그램 한눈에 보기",
        breadcrumb: {
          "@id": "https://sokcho-moa.vercel.app/topics/experience#breadcrumb",
        },
      }),
      expect.objectContaining({
        "@type": "BreadcrumbList",
        "@id": "https://sokcho-moa.vercel.app/topics/experience#breadcrumb",
        itemListElement: expect.arrayContaining([
          expect.objectContaining({ position: 1, name: "속초모아" }),
          expect.objectContaining({ position: 2, name: "속초 체험" }),
        ]),
      }),
    ]);
  });

  it("사이트맵에는 필터 조합 없이 6개 대표 주제 URL만 포함한다", async () => {
    const entries = await sitemap();
    const topicUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.includes("/topics/"));

    expect(topicUrls).toEqual(
      eventTopics.map((topic) => `https://sokcho-moa.vercel.app${topic.path}`),
    );
    expect(topicUrls.every((url) => !url.includes("?"))).toBe(true);
  });
});
