import type { Metadata } from "next";
import { z } from "zod";
import { AnalyticsMountTracking } from "@/components/analytics/analytics-mount-tracking";
import { RecentSearchList } from "@/components/layout/recent-search-list";
import { SiteSearchField } from "@/components/layout/site-search-field";
import { buildSiteSearchHref } from "@/components/layout/site-search-href";
import { getButtonClassName } from "@/components/ui/button-styles";
import { getFilterChipClassName } from "@/components/ui/filter-chip-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import { filterEvents, sortEvents } from "@/features/events/model/event-list";
import { isEventClosedForDiscovery } from "@/features/events/model/event-state";
import { getAllPublicEvents } from "@/features/events/queries";
import { ActivityPlaceRow, activityPlaceListClassName } from "@/features/places/components/activity-place-row";
import { searchActivityPlaces } from "@/features/places/model/activity";
import { getPublicPlaces } from "@/features/places/queries";
import { NOINDEX_FOLLOW_ROBOTS } from "@/lib/seo/site-identity";

// 검색 결과는 검색어마다 달라 검색엔진에 올리지 않는다. 목록·상세 페이지가 검색 노출을 맡는다.
export const metadata: Metadata = {
  title: "검색",
  description: "속초의 행사와 가볼만한 곳을 한 번에 찾아보세요.",
  robots: NOINDEX_FOLLOW_ROBOTS,
};

const searchTypes = ["events", "places"] as const;

const searchParamsSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  type: z.enum(searchTypes).nullable().catch(null),
});

/** "전체"에서 종류마다 먼저 보여 줄 개수. 나머지는 "더 보기"로 그 종류만 본다(NN/g Scoped Search: 기본은 전체, 결과에서 좁히기). */
const PREVIEW_EVENT_COUNT = 4;
const PREVIEW_PLACE_COUNT = 5;

/**
 * 통합 검색(.ai/DESIGN.md 통합 검색). 헤더 돋보기(lg 미만)나 검색창(lg 이상)에서 온다.
 * 행사와 가볼만한 곳을 함께 찾고, 범위 칩(전체·행사·가볼만한 곳)과 건수로 좁힌다. 검색어와 범위는 주소에 남는다(2026-11-21 사용자 결정).
 * data-hide-bottom-nav: 검색창에 입력하는 동안만 하단 탭을 숨긴다. 키보드가 열리면 고정된 탭이 가려지거나 떠 보인다(globals.css).
 * data-hide-header-search: 화면 안의 검색창과 겹치지 않게 lg 이상 헤더 검색창을 숨긴다(globals.css).
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = await searchParams;
  const { q: query, type } = searchParamsSchema.parse({
    q: typeof raw.q === "string" ? raw.q : "",
    type: typeof raw.type === "string" ? raw.type : null,
  });
  const [allEvents, places] = await Promise.all([getAllPublicEvents(), getPublicPlaces()]);
  const now = new Date();

  // 진행 중인 행사를 먼저 보이고, 끝난 행사는 뒤에 둔다(카드에 마감 표시가 붙는다).
  const matchedEvents = query ? sortEvents(filterEvents(allEvents, { query }, now), "latest", now) : [];
  const events = [...matchedEvents.filter((event) => !isEventClosedForDiscovery(event, now)), ...matchedEvents.filter((event) => isEventClosedForDiscovery(event, now))];
  const matchedPlaces = query ? searchActivityPlaces(places, query) : [];
  const showEvents = type !== "places";
  const showPlaces = type !== "events";
  const scopes = [
    { type: null, label: "전체", count: events.length + matchedPlaces.length },
    { type: "events" as const, label: "행사", count: events.length },
    { type: "places" as const, label: "가볼만한 곳", count: matchedPlaces.length },
  ];

  return (
    <main id="main-content" data-hide-bottom-nav data-hide-header-search className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:pt-8">
      <h1 className="sr-only">검색</h1>
      <div className="lg:mx-auto lg:max-w-2xl">
        <SiteSearchField query={query} type={type} />
      </div>

      {query === "" ? (
        <div className="lg:mx-auto lg:max-w-2xl">
          <RecentSearchList />
        </div>
      ) : (
        <>
          <AnalyticsMountTracking
            name="site_search_viewed"
            properties={{ query_length: Array.from(query).length, event_count: events.length, place_count: matchedPlaces.length }}
            onceKey={`${query}|${type ?? "all"}`}
          />
          <nav aria-label="검색 범위" className="mt-4 flex flex-wrap gap-x-2">
            {scopes.map((scope) => {
              const isCurrent = scope.type === type;
              return (
                <TransitionLink
                  key={scope.label}
                  href={buildSiteSearchHref(query, scope.type)}
                  showPendingIndicator={false}
                  scroll={false}
                  aria-current={isCurrent ? "page" : undefined}
                  className="group inline-flex min-h-11 items-center"
                >
                  {/* 분야 칩과 같은 모양(filter-chip-styles.ts, 2026-11-21 통일) */}
                  <span className={getFilterChipClassName(isCurrent)}>{scope.label}<span className="ml-1.5 tabular-nums">{scope.count}</span></span>
                </TransitionLink>
              );
            })}
          </nav>

          {events.length + matchedPlaces.length === 0 && (
            <div className="mt-10">
              <p className="text-body text-content-strong">&lsquo;{query}&rsquo;에 맞는 행사나 장소가 없어요.</p>
              <p className="mt-1 text-label font-normal text-content-muted">띄어쓰기를 바꾸거나 더 짧은 말로 찾아보세요.</p>
            </div>
          )}

          {Boolean(showEvents && events.length > 0) && (
            <section aria-labelledby="search-events-title" className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h2 id="search-events-title" className="text-title-2 text-content-strong">행사</h2>
                {type === null && events.length > PREVIEW_EVENT_COUNT && (
                  <TransitionLink href={buildSiteSearchHref(query, "events")} showPendingIndicator={false} className={getButtonClassName({ variant: "tonal" })}>행사 {events.length}개 모두 보기</TransitionLink>
                )}
              </div>
              <div className={`mt-4 ${eventCardGridClassName}`}>
                {(type === null ? events.slice(0, PREVIEW_EVENT_COUNT) : events).map((event) => <EventCard key={event.id} event={event} contentSource="site_search" />)}
              </div>
            </section>
          )}

          {Boolean(showPlaces && matchedPlaces.length > 0) && (
            <section aria-labelledby="search-places-title" className="mt-10">
              <div className="flex items-center justify-between gap-3">
                <h2 id="search-places-title" className="text-title-2 text-content-strong">가볼만한 곳</h2>
                {type === null && matchedPlaces.length > PREVIEW_PLACE_COUNT && (
                  <TransitionLink href={buildSiteSearchHref(query, "places")} showPendingIndicator={false} className={getButtonClassName({ variant: "tonal" })}>{matchedPlaces.length}곳 모두 보기</TransitionLink>
                )}
              </div>
              <ul className={`mt-3 ${activityPlaceListClassName}`}>
                {(type === null ? matchedPlaces.slice(0, PREVIEW_PLACE_COUNT) : matchedPlaces).map((place) => <ActivityPlaceRow key={place.id} place={place} contentSource="site_search" />)}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
