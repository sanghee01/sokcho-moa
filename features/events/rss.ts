import { type Event, getEventIntroduction } from "@/features/events/model/event";
import { categoryLabels } from "@/features/events/model/taxonomy";
import { resolveEventAddress } from "@/features/events/model/venue";
import { buildEventSummary } from "@/features/events/seo";
import { buildRssXml, type RssItem } from "@/lib/seo/rss";
import { HOME_TITLE, SITE_DESCRIPTION } from "@/lib/seo/site-identity";

export const EVENT_RSS_PATH = "/rss.xml";
// 검색엔진이 새 행사를 찾는 용도라 최근 것만 담는다. 전체 목록은 sitemap이 맡는다(2026-11-15).
const EVENT_RSS_ITEM_LIMIT = 50;

/** 새 행사 RSS 2.0. 네이버 서치어드바이저에 제출해 새로 공개한 행사를 빨리 수집하게 한다(2026-11-15). */
export function buildEventsRssXml(events: readonly Event[], siteUrl: string) {
  const homeUrl = new URL("/", siteUrl).toString();
  const items = [...events]
    .map((event) => ({ event, publishedAt: parseDate(event.publishedAt) }))
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, EVENT_RSS_ITEM_LIMIT)
    .map(({ event, publishedAt }): RssItem => ({
      title: event.title,
      link: new URL(`/events/${event.slug}`, homeUrl).toString(),
      description: buildEventRssDescription(event),
      category: categoryLabels[event.category],
      publishedAt,
    }));

  return buildRssXml({
    title: HOME_TITLE,
    link: homeUrl,
    description: SITE_DESCRIPTION,
    selfUrl: new URL(EVENT_RSS_PATH, homeUrl).toString(),
    language: "ko",
    lastBuildDate: items[0]?.publishedAt,
    items,
  });
}

// 검색 설명과 같은 요약 문장에 주소와 소개를 더한다. RSS는 길이 제한이 없어 자르지 않는다(2026-11-15).
function buildEventRssDescription(event: Event) {
  const address = resolveEventAddress(event);
  return [
    buildEventSummary(event),
    address ? `주소는 ${address}입니다.` : null,
    getEventIntroduction(event)?.trim() || null,
  ].filter((part): part is string => Boolean(part)).join(" ");
}

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
