import Link from "next/link";
import { EventCard } from "@/features/events/components/event-card";
import { EventHeroFrame } from "@/features/events/components/event-hero-frame";
import { EventSearch } from "@/features/events/components/event-search";
import { EventSort } from "@/features/events/components/event-sort";
import { TransitionLink } from "@/components/ui/transition-link";
import { getPublicEnv } from "@/lib/env";
import { getAllPublicEvents } from "@/features/events/queries";
import {
  filterEvents,
  parseEventFilters,
  sortEvents,
} from "@/features/events/model/event";
import {
  buildEventBrowseHref,
  clearEventFiltersHref,
  type EventSearchParams,
  withEventBrowsePath,
} from "@/features/events/model/browse-url";
import type { EventTopic } from "@/features/events/model/topics";
import { buildSiteStructuredData } from "@/lib/seo/site-structured-data";
import { buildTopicStructuredData } from "@/features/events/topic-seo";

function HeroBurst({ side }: { side: "left" | "right" }) {
  const rayColors = side === "left"
    ? ["bg-sky-500", "bg-sky-500", "bg-sky-500", "bg-sky-500"]
    : ["bg-amber-400", "bg-orange-400", "bg-teal-500", "bg-amber-400"];

  return (
    <span aria-hidden="true" className={`relative size-[clamp(1.65rem,3.7vw,4rem)] shrink-0 -translate-y-[28%] ${side === "right" ? "-scale-x-100" : ""}`}>
      <span className={`absolute left-[46%] top-0 h-[36%] w-[13%] -rotate-6 rounded-full ${rayColors[0]}`} />
      <span className={`absolute left-[19%] top-[16%] h-[36%] w-[13%] -rotate-45 rounded-full ${rayColors[1]}`} />
      <span className={`absolute left-[4%] top-[48%] h-[36%] w-[13%] -rotate-[68deg] rounded-full ${rayColors[2]}`} />
      <span className={`absolute left-[60%] top-[19%] h-[32%] w-[12%] rotate-[28deg] rounded-full ${rayColors[3]}`} />
    </span>
  );
}

function EventHero({ topic }: { topic?: EventTopic }) {
  return (
    <section
      aria-label={topic ? `${topic.heading} 안내` : undefined}
      aria-labelledby={topic ? undefined : "home-hero-title"}
      className="overflow-hidden bg-cyan-50"
    >
      {!topic && (
        <p className="sr-only">공연·체험·교육·전시를 포함한 속초의 최신 행사 정보를 확인하세요.</p>
      )}
      <EventHeroFrame priority overlayAriaHidden={Boolean(topic)}>
        <div className="-translate-y-[2%] text-center">
          <div className="flex items-center justify-center gap-[clamp(0.25rem,1.2vw,1.5rem)]">
            <HeroBurst side="left" />
            {topic ? (
              <p className="whitespace-nowrap text-[clamp(1.6rem,5.3vw,5.15rem)] font-black leading-none tracking-[-0.045em] drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                <span className="text-[#07377a]">요즘 </span>
                <span className="text-[#009c91]">속초</span>
                <span className="text-[#07377a]">에서 뭐하지?</span>
              </p>
            ) : (
              <h1 id="home-hero-title" className="whitespace-nowrap text-[clamp(1.6rem,5.3vw,5.15rem)] font-black leading-none tracking-[-0.045em] drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                <span className="text-[#07377a]">요즘 </span>
                <span className="text-[#009c91]">속초</span>
                <span className="text-[#07377a]">에서 뭐하지?</span>
              </h1>
            )}
            <HeroBurst side="right" />
          </div>
          <p className="mt-[clamp(0.6rem,1.15vw,1.4rem)] text-[clamp(0.72rem,2.1vw,1.75rem)] font-medium tracking-[-0.035em] text-slate-600 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            속초 행사 · 축제 · 공연 · 체험을 한눈에
            <span aria-hidden="true" className="ml-[clamp(0.35rem,0.8vw,0.8rem)] font-black tracking-[-0.25em] text-sky-500">≋≋</span>
          </p>
        </div>
      </EventHeroFrame>
    </section>
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
  const events = sortEvents(filteredEvents, filters.sort, now);
  const closedView = filters.status === "closed";
  const resultTitle = topic
    ? `${topic.label} ${closedView ? "마감 행사" : "목록"}`
    : closedView ? "마감 행사" : "행사 목록";
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const jsonLd = topic
    ? buildTopicStructuredData(topic, siteUrl)
    : buildSiteStructuredData(siteUrl);

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <EventHero topic={topic} />

      <div className="mx-auto max-w-6xl space-y-9 px-4 py-8 sm:px-6 sm:py-12">
        {topic && (
          <section aria-labelledby="topic-page-title" className="max-w-3xl">
            <p className="text-sm font-black text-teal-700">속초 {topic.label} 일정</p>
            <h1 id="topic-page-title" className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{topic.heading}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">{topic.intro}</p>
          </section>
        )}


        <section aria-labelledby="event-results-title" data-event-view={closedView ? "closed" : "active"}>
          <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,23rem)_auto] xl:items-center xl:gap-5">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h2 id="event-results-title" className="text-2xl font-black text-slate-950 sm:text-3xl">{resultTitle} {filteredEvents.length}개</h2>
              <nav aria-label="행사 상태" className="inline-flex shrink-0 items-center border-b border-slate-300">
                <TransitionLink
                  href={buildEventBrowseHref(navigationParams, { status: undefined, application: undefined })}
                  pendingLabel="진행중 행사 불러오는 중"
                  showPendingIndicator={false}
                  scroll={false}
                  rel="nofollow"
                  aria-current={!closedView ? "page" : undefined}
                  className={`-mb-px inline-flex min-h-11 items-center justify-center border-b-2 px-3 text-base font-black ${!closedView ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
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
                  className={`-mb-px inline-flex min-h-11 items-center justify-center border-b-2 px-3 text-base font-black ${closedView ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
                >
                  마감
                </TransitionLink>
              </nav>
            </div>
            <EventSearch params={navigationParams} query={filters.query} />
            <EventSort params={navigationParams} activeSort={filters.sort} />
          </div>
          {events.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => <EventCard key={event.id} event={event} contentSource="event_list" />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-teal-300 bg-white px-6 py-16 text-center">
              <p className="text-xl font-black text-slate-900">{closedView ? "조건에 맞는 마감 행사가 없어요." : "조건에 맞는 진행중 행사가 아직 없어요."}</p>
              <p className="mt-2 text-slate-600">검색어를 바꾸거나 선택 조건을 지우고 다시 찾아보세요.</p>
              <Link href={clearEventFiltersHref(navigationParams)} className="mt-6 inline-block rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">조건 초기화</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
