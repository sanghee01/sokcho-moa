import { describe, expect, it, vi } from "vitest";
import { makeEvent } from "@/tests/unit/support/event-builder";

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://sokchomoa.com" }),
}));

vi.mock("@/features/events/queries", () => ({
  getAllPublicEvents: vi.fn(async () => [
    makeEvent({ slug: "dorumuk-festival", title: "도루묵 축제", publishedAt: "2026-11-01T00:00:00.000Z" }),
  ]),
}));

import { GET as getRss } from "@/app/rss.xml/route";
import { buildEventsRssXml } from "@/features/events/rss";

const SITE_URL = "https://sokchomoa.com";

function items(xml: string) {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g), (match) => match[1]);
}

// 네이버 서치어드바이저에 제출하는 새 행사 목록(RSS 2.0). 새로 공개한 행사를 검색엔진이 빨리 찾게 한다(2026-11-15).
describe("행사 RSS", () => {
  it("최근 공개한 행사부터 상세 주소·제목·분야·게시 시각을 담는다", () => {
    const xml = buildEventsRssXml([
      makeEvent({ slug: "older", title: "먼저 공개한 행사", category: "festival", publishedAt: "2026-11-01T00:00:00.000Z" }),
      makeEvent({ slug: "newer", title: "나중에 공개한 행사", category: "performance", publishedAt: "2026-11-10T03:00:00.000Z" }),
    ], SITE_URL);
    const [first, second] = items(xml);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<rss version="2\.0"/);
    expect(first).toContain("<title>나중에 공개한 행사</title>");
    expect(first).toContain("<link>https://sokchomoa.com/events/newer</link>");
    expect(first).toContain('<guid isPermaLink="true">https://sokchomoa.com/events/newer</guid>');
    expect(first).toContain("<category>공연</category>");
    expect(first).toContain("<pubDate>Tue, 10 Nov 2026 03:00:00 GMT</pubDate>");
    expect(second).toContain("<title>먼저 공개한 행사</title>");
  });

  it("채널은 사이트 주소·자기 주소와 가장 최근 게시 시각을 가진다", () => {
    const xml = buildEventsRssXml([
      makeEvent({ publishedAt: "2026-11-01T00:00:00.000Z" }),
      makeEvent({ publishedAt: "2026-11-10T03:00:00.000Z" }),
    ], SITE_URL);
    const channel = xml.slice(0, xml.indexOf("<item>"));

    expect(channel).toContain("<link>https://sokchomoa.com/</link>");
    expect(channel).toContain('<atom:link href="https://sokchomoa.com/rss.xml" rel="self" type="application/rss+xml"/>');
    expect(channel).toContain("<language>ko</language>");
    expect(channel).toContain("<lastBuildDate>Tue, 10 Nov 2026 03:00:00 GMT</lastBuildDate>");
  });

  // 설명은 검색 설명과 같은 요약 문장(2026-11-15)에 주소와 소개를 잇는다.
  it("설명에 요약 문장·주소·소개를 담는다", () => {
    const [item] = items(buildEventsRssXml([
      makeEvent({
        eventStartAt: "2026-11-05T15:00:00.000Z",
        eventEndAt: "2026-11-15T14:59:00.000Z",
        locationName: "속초항 항만부지",
        address: "강원특별자치도 속초시 설악금강대교로 1",
        priceText: "무료",
        summary: "도루묵과 양미리를 맛보는 겨울 축제입니다.",
      }),
    ], SITE_URL));

    expect(item).toMatch(/<description>.*2026년 11월 6일\(금\)부터 11월 15일\(일\)까지 속초항 항만부지에서.*요금은 무료입니다\..*주소는 강원특별자치도 속초시 설악금강대교로 1입니다\..*도루묵과 양미리를 맛보는 겨울 축제입니다\.<\/description>/);
  });

  it("XML 특수문자는 escape하고, XML에 쓸 수 없는 제어 문자는 뺀다", () => {
    const [item] = items(buildEventsRssXml([
      makeEvent({ title: "<음악> & \"재즈\" 'night'\u0007" }),
    ], SITE_URL));

    expect(item).toContain("<title>&lt;음악&gt; &amp; &quot;재즈&quot; &apos;night&apos;</title>");
  });

  it("최근 50개만 담는다", () => {
    const events = Array.from({ length: 60 }, (_, index) => makeEvent({
      publishedAt: new Date(Date.UTC(2026, 9, 1 + index)).toISOString(),
    }));

    expect(items(buildEventsRssXml(events, SITE_URL))).toHaveLength(50);
  });

  it("/rss.xml은 RSS 형식으로 공개 행사를 응답한다", async () => {
    const response = await getRss();

    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
    expect(await response.text()).toContain("<link>https://sokchomoa.com/events/dorumuk-festival</link>");
  });
});
