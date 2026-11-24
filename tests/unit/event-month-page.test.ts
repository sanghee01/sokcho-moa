import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeEvent } from "@/tests/unit/support/event-builder";

// 'use cache' 함수 안의 cacheLife·cacheTag는 Next.js 밖(vitest)에서 부르면 오류를 낸다. 저장 기간은 이 test가 보는 값이 아니라 아무 일도 하지 않게 둔다(2026-11-24).
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://sokcho-moa.vercel.app" }),
}));

const events = [
  makeEvent({ slug: "october-festival", title: "가을 축제", eventStartAt: "2026-10-03T01:00:00.000Z", eventEndAt: null }),
  makeEvent({ slug: "november-concert", title: "11월 음악회", category: "performance", eventStartAt: "2026-11-19T10:00:00.000Z", eventEndAt: null }),
];

vi.mock("@/features/events/queries", () => ({
  getAllPublicEvents: vi.fn(async () => events),
}));

import { generateMetadata, generateStaticParams } from "@/app/months/[month]/page";
import {
  generateMetadata as generateCategoryMetadata,
  generateStaticParams as generateCategoryStaticParams,
} from "@/app/months/[month]/[category]/page";
import { buildMonthStructuredData } from "@/features/events/month-seo";

function metadataFor(month: string) {
  return generateMetadata({ params: Promise.resolve({ month }), searchParams: Promise.resolve({}) });
}

function categoryMetadataFor(month: string, category: string) {
  return generateCategoryMetadata({ params: Promise.resolve({ month, category }), searchParams: Promise.resolve({}) });
}

describe("월별 행사 페이지", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 2026-11-15 12:00 KST
    vi.setSystemTime(new Date("2026-11-15T03:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("이번 달과 다음 달을 미리 만든다", async () => {
    expect(await generateStaticParams()).toEqual([{ month: "2026-11" }, { month: "2026-12" }]);
  });

  it("월 이름이 들어간 제목, 행사 수 설명, self-canonical을 쓴다", async () => {
    expect(await metadataFor("2026-11")).toMatchObject({
      title: "2026년 11월 속초 행사·축제 일정",
      description: "2026년 11월 속초에서 열리는 행사는 모두 1개예요(공연 1개).",
      alternates: { canonical: "/months/2026-11" },
      openGraph: { url: "/months/2026-11", title: "2026년 11월 속초 행사·축제 일정" },
    });
  });

  it("행사가 있는 지난 달은 열고, 형식이 틀리거나 행사 없는 지난 달·다다음 달은 404로 중단한다", async () => {
    await expect(metadataFor("2026-10")).resolves.toMatchObject({ alternates: { canonical: "/months/2026-10" } });
    for (const month of ["2026-9", "2026-09", "2027-01", "november"]) {
      await expect(metadataFor(month)).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    }
  });

  it("달·분야 페이지는 이번 달·다음 달의 모든 분야를 미리 만든다", async () => {
    const params = await generateCategoryStaticParams();
    expect(params).toHaveLength(12);
    expect(params).toContainEqual({ month: "2026-12", category: "education" });
  });

  it("달·분야 페이지는 분야 이름이 들어간 제목과 설명을 쓰고, 행사가 있으면 검색에 올린다", async () => {
    expect(await categoryMetadataFor("2026-11", "performance")).toMatchObject({
      title: "2026년 11월 속초 공연 일정",
      description: "2026년 11월 속초 공연 행사는 모두 1개예요.",
      alternates: { canonical: "/months/2026-11/performance" },
      robots: { index: true },
    });
  });

  // 달마다 분야 6개씩 생기는 페이지 중 빈 페이지가 검색에 쌓이지 않게 한다(2026-11-15 사용자 결정).
  it("행사가 없는 달·분야 페이지는 열되 검색에는 올리지 않는다", async () => {
    expect(await categoryMetadataFor("2026-11", "education")).toMatchObject({
      robots: { index: false, follow: true },
    });
  });

  it("없는 분야나 열지 않는 달의 분야 페이지는 404로 중단한다", async () => {
    await expect(categoryMetadataFor("2026-11", "unknown")).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    await expect(categoryMetadataFor("2027-01", "performance")).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("구조화 데이터는 월 페이지, 경로, 행사 상세 목록을 같은 주소로 잇는다", () => {
    const novemberEvents = events.slice(1);
    const data = buildMonthStructuredData({ year: 2026, month: 11 }, novemberEvents, "요약", "https://sokcho-moa.vercel.app");
    const pageUrl = "https://sokcho-moa.vercel.app/months/2026-11";

    expect(data["@graph"]).toEqual([
      expect.objectContaining({
        "@type": "CollectionPage",
        url: pageUrl,
        name: "2026년 11월 속초 행사·축제 일정",
        description: "요약",
        mainEntity: { "@id": `${pageUrl}#events` },
      }),
      expect.objectContaining({
        "@type": "ItemList",
        "@id": `${pageUrl}#events`,
        numberOfItems: 1,
        itemListElement: [
          { "@type": "ListItem", position: 1, url: "https://sokcho-moa.vercel.app/events/november-concert", name: "11월 음악회" },
        ],
      }),
      expect.objectContaining({
        "@type": "BreadcrumbList",
        itemListElement: [
          expect.objectContaining({ position: 1, item: "https://sokcho-moa.vercel.app/" }),
          expect.objectContaining({ position: 2, name: "2026년 11월 속초 행사", item: pageUrl }),
        ],
      }),
    ]);
  });
});
