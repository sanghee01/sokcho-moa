import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import { EventSearch } from "@/features/events/components/browse/event-search";
import { EventSort } from "@/features/events/components/browse/event-sort";
import { getPublicEnv } from "@/lib/env";
import { getAllPublicEvents } from "@/features/events/queries";
import {
  DEFAULT_EVENT_SORT,
  filterEvents,
  hasLegacyEventFilters,
  parseEventFilters,
  sortEvents,
} from "@/features/events/model/event-list";
import type { Event } from "@/features/events/model/event";
import {
  buildEventBrowseHref,
  clearEventFiltersHref,
  type EventSearchParams,
  withEventBrowsePath,
} from "@/features/events/model/browse-url";
import type { EventTopic } from "@/features/events/model/topics";
import { buildSiteStructuredData } from "@/lib/seo/site-structured-data";
import { buildTopicStructuredData } from "@/features/events/topic-seo";
import { JsonLd } from "@/components/seo/json-ld";

// 진행중/마감은 밑줄 탭, 정렬은 묶음 버튼으로 모양을 구분한다(.ai/DESIGN.md 페이지 구조 > 홈·주제 목록).
function statusTabClassName(selected: boolean) {
  return `-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-label lg:min-h-12 lg:px-4 lg:text-body ${selected
    ? "border-primary font-semibold text-primary-text"
    : "border-transparent text-content-subtle hover:text-content"}`;
}

function EventCardGrid({ events, showCategory }: { events: Event[]; showCategory: boolean }) {
  return (
    <div className={eventCardGridClassName}>
      {events.map((event) => <EventCard key={event.id} event={event} contentSource="event_list" showCategory={showCategory} />)}
    </div>
  );
}

interface EmptyResultContent {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

/**
 * 목록이 비었을 때 상황에 맞는 안내(2026-11-06). 사용자가 하지 않은 일("검색어를 바꾸거나 조건을 지우고")을 말하지 않고,
 * 실제로 갈 만한 곳 하나를 버튼으로 준다. 분야 이름 뒤에는 받침에 따라 바뀌는 조사를 붙이지 않는다.
 * 고르는 순서: 검색어 → 예전 주소의 조건 → 마감 탭 → 기본(예전에는 중첩 삼항 한 식이었다, 2026-11-07).
 */
function getEmptyResultContent({
  query,
  closedView,
  topicLabel,
  hasLegacyFilters,
  params,
}: {
  query?: string;
  closedView: boolean;
  topicLabel?: string;
  hasLegacyFilters: boolean;
  params: EventSearchParams;
}): EmptyResultContent {
  const label = topicLabel ?? "행사";
  if (query) {
    return {
      title: `'${query}' 검색 결과가 없어요`,
      description: "다른 단어로 검색해 보세요.",
      action: { label: "검색 지우기", href: buildEventBrowseHref(params, { q: undefined }) },
    };
  }
  if (hasLegacyFilters) {
    return { title: "조건에 맞는 행사가 없어요", action: { label: "조건 지우기", href: clearEventFiltersHref(params) } };
  }
  if (closedView) {
    return {
      title: `마감된 ${label} 기록이 아직 없어요`,
      action: { label: `진행 중인 ${label} 보기`, href: buildEventBrowseHref(params, { status: undefined }) },
    };
  }
  return {
    title: `예정되거나 진행 중인 ${label} 일정이 아직 없어요`,
    description: "새 일정이 올라오면 여기에 보여 드릴게요.",
    action: topicLabel ? { label: "전체 행사 보기", href: "/" } : undefined,
  };
}

function EmptyResult({ content }: { content: EmptyResultContent }) {
  return (
    <div className="rounded-card bg-surface-subtle px-6 py-12 text-center">
      <p className="text-title-3 text-content-strong">{content.title}</p>
      {content.description !== undefined && <p className="mt-2 text-body text-content-muted">{content.description}</p>}
      {content.action !== undefined && (
        <Link href={content.action.href} className={`${getButtonClassName({ variant: "secondary" })} mt-6`}>{content.action.label}</Link>
      )}
    </div>
  );
}

export async function EventBrowsePage({
  searchParams,
  topic,
}: {
  searchParams: Promise<EventSearchParams>;
  topic?: EventTopic;
}) {
  const [rawParams, allEvents] = await Promise.all([searchParams, getAllPublicEvents()]);
  const browseParams = topic
    ? Object.fromEntries(Object.entries(rawParams).filter(([name]) => name !== "category"))
    : rawParams;
  const navigationParams = withEventBrowsePath(browseParams, topic?.path ?? "/");
  const parsedFilters = parseEventFilters(rawParams);
  const filters = topic
    ? { ...parsedFilters, category: topic.category }
    : parsedFilters;
  const now = new Date();
  const filteredEvents = filterEvents(allEvents, filters, now);
  const sort = filters.sort ?? DEFAULT_EVENT_SORT;
  const events = sortEvents(filteredEvents, sort, now);
  const closedView = filters.status === "closed";
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const jsonLd = topic
    ? buildTopicStructuredData(topic, siteUrl)
    : buildSiteStructuredData(siteUrl);

  return (
    <main id="main-content">
      <JsonLd data={jsonLd} />

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:pt-6">
        {/* 주제 페이지 제목은 화면 읽기 프로그램·검색엔진용으로만 남긴다. 소개 문장은 쓰지 않는다(2026-11-06). */}
        {topic !== undefined && <h1 id="topic-page-title" className="sr-only">{topic.heading}</h1>}
        {!topic && <h1 id="home-hero-title" className="sr-only">요즘 속초에서 뭐하지?</h1>}
        {!topic && <p className="sr-only">공연·체험·교육·전시를 포함한 속초의 최신 행사 정보를 확인하세요.</p>}

        {/* 넓은 화면에서는 가운데 정렬한 분야 탭과 맞춰 검색창도 가운데에 둔다. */}
        <div className="lg:mx-auto lg:max-w-xl">
          <EventSearch params={navigationParams} query={filters.query} />
        </div>

        <section aria-labelledby="event-results-title" data-event-view={closedView ? "closed" : "active"} className="mt-6 lg:mt-10">
          {/* 행사 개수는 보여 주지 않는다(2026-11-06). 구역 제목은 화면 읽기 프로그램용으로 남긴다. */}
          <h2 id="event-results-title" className="sr-only">{closedView ? "마감 행사" : "행사 목록"}</h2>
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-line">
            <nav aria-label="행사 상태" className="flex items-center">
                <TransitionLink
                  href={buildEventBrowseHref(navigationParams, { status: undefined, application: undefined })}
                  pendingLabel="진행중 행사 불러오는 중"
                  showPendingIndicator={false}
                  scroll={false}
                  rel="nofollow"
                  aria-current={!closedView ? "page" : undefined}
                  className={statusTabClassName(!closedView)}
                >
                  진행중
                </TransitionLink>
                <TransitionLink
                  href={buildEventBrowseHref(navigationParams, { status: "closed", application: undefined })}
                  pendingLabel="마감 행사 불러오는 중"
                  showPendingIndicator={false}
                  scroll={false}
                  rel="nofollow"
                  aria-current={closedView ? "page" : undefined}
                  className={statusTabClassName(closedView)}
                >
                  마감
                </TransitionLink>
            </nav>
            <div className="pb-1.5">
              <EventSort params={navigationParams} activeSort={filters.sort} />
            </div>
          </div>
          {events.length === 0 ? (
            <EmptyResult
              content={getEmptyResultContent({
                query: filters.query,
                closedView,
                topicLabel: topic?.label,
                hasLegacyFilters: hasLegacyEventFilters(filters),
                params: navigationParams,
              })}
            />
          ) : (
            <EventCardGrid events={events} showCategory={!topic} />
          )}
        </section>

      </div>
    </main>
  );
}
