import type { Metadata } from "next";
import type { Event } from "@/features/events/model/event";
import {
  eventMonthPath,
  formatEventMonthLabel,
  type EventMonth,
} from "@/features/events/model/event-month";
import { categoryLabels, type EventCategory } from "@/features/events/model/taxonomy";
import type { EventMonthPageData } from "@/features/events/month-page";
import {
  INDEXABLE_ROBOTS,
  NOINDEX_FOLLOW_ROBOTS,
  SITE_NAME,
  SITE_OPEN_GRAPH_IMAGE_PATH,
} from "@/lib/seo/site-identity";

/**
 * 월별 행사 페이지의 제목. 전체는 검색어 "11월 속초 행사", "속초 축제 일정"에, 분야를 고르면 "속초 11월 교육"에 맞춘다.
 */
export function eventMonthTitle(month: EventMonth, category?: EventCategory) {
  const label = formatEventMonthLabel(month);
  return category ? `${label} 속초 ${categoryLabels[category]} 일정` : `${label} 속초 행사·축제 일정`;
}

const DESCRIPTION_MAX_CHARS = 160;

/**
 * 월별 행사 페이지의 metadata. 분야를 골랐는데 행사가 없는 페이지는 검색에 올리지 않는다.
 * 달마다 분야 6개씩 생기는 페이지 중 빈 페이지가 검색에 쌓이지 않게 하려는 것이다(2026-11-15 사용자 결정).
 * 링크는 따라가게(follow) 두어 화살표·탭으로 이어진 다른 달·분야 페이지는 계속 찾게 한다.
 */
export function buildEventMonthMetadata({ month, category, events, description: fullDescription }: EventMonthPageData): Metadata {
  const title = eventMonthTitle(month, category);
  const description = fullDescription.length <= DESCRIPTION_MAX_CHARS
    ? fullDescription
    : `${fullDescription.slice(0, DESCRIPTION_MAX_CHARS - 1).trimEnd()}…`;
  const path = eventMonthPath(month, category);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: category && events.length === 0 ? NOINDEX_FOLLOW_ROBOTS : INDEXABLE_ROBOTS,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: SITE_OPEN_GRAPH_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} 로고` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OPEN_GRAPH_IMAGE_PATH],
    },
  };
}

/**
 * 월별 행사 페이지의 구조화 데이터. 페이지(CollectionPage)가 그 달(분야) 행사 상세 목록(ItemList)을 담고,
 * 경로(BreadcrumbList)는 홈 → 월 페이지(→ 분야)다. 행사 하나하나의 Event 데이터는 상세 페이지가 맡는다.
 */
export function buildMonthStructuredData(
  month: EventMonth,
  events: Event[],
  description: string,
  siteUrl: string,
  category?: EventCategory,
) {
  const homeUrl = new URL("/", siteUrl).toString();
  const monthUrl = new URL(eventMonthPath(month), homeUrl).toString();
  const pageUrl = new URL(eventMonthPath(month, category), homeUrl).toString();
  const listId = `${pageUrl}#events`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const breadcrumbs = [
    { "@type": "ListItem", position: 1, name: SITE_NAME, item: homeUrl },
    { "@type": "ListItem", position: 2, name: `${formatEventMonthLabel(month)} 속초 행사`, item: monthUrl },
    ...(category ? [{ "@type": "ListItem", position: 3, name: categoryLabels[category], item: pageUrl }] : []),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        url: pageUrl,
        name: eventMonthTitle(month, category),
        description,
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
        itemListElement: breadcrumbs,
      },
    ],
  };
}
