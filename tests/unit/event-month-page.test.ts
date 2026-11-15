import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeEvent } from "@/tests/unit/support/event-builder";

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
import { buildMonthStructuredData } from "@/features/events/month-seo";

function metadataFor(month: string) {
  return generateMetadata({ params: Promise.resolve({ month }), searchParams: Promise.resolve({}) });
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

  it("월 이름이 들어간 제목, 요약 문장 설명, self-canonical을 쓴다", async () => {
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
