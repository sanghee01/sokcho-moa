import type { Event } from "@/features/events/model/event";
import {
  eventMonthPath,
  formatEventMonthLabel,
  type EventMonth,
} from "@/features/events/model/event-month";
import { SITE_NAME } from "@/lib/seo/site-identity";

/** 월별 행사 페이지의 제목. 검색어 "11월 속초 행사", "속초 축제 일정"에 맞춘다. */
export function eventMonthTitle(month: EventMonth) {
  return `${formatEventMonthLabel(month)} 속초 행사·축제 일정`;
}

/**
 * 월별 행사 페이지의 구조화 데이터. 페이지(CollectionPage)가 그 달 행사 상세 목록(ItemList)을 담고,
 * 경로(BreadcrumbList)는 홈 → 월 페이지다. 행사 하나하나의 Event 데이터는 상세 페이지가 맡는다.
 */
export function buildMonthStructuredData(month: EventMonth, events: Event[], summary: string, siteUrl: string) {
  const homeUrl = new URL("/", siteUrl).toString();
  const pageUrl = new URL(eventMonthPath(month), homeUrl).toString();
  const listId = `${pageUrl}#events`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        url: pageUrl,
        name: eventMonthTitle(month),
        description: summary,
        inLanguage: "ko-KR",
        isPartOf: { "@id": `${homeUrl}#website` },
        breadcrumb: { "@id": breadcrumbId },
        mainEntity: { "@id": listId },
      },
      {
        "@type": "ItemList",
        "@id": listId,
        numberOfItems: events.length,
        itemListElement: events.map((event, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: new URL(`/events/${event.slug}`, homeUrl).toString(),
          name: event.title,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: homeUrl },
          { "@type": "ListItem", position: 2, name: `${formatEventMonthLabel(month)} 속초 행사`, item: pageUrl },
        ],
      },
    ],
  };
}
