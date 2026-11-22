import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalyticsViewTracking } from "@/components/analytics/analytics-view-tracking";
import { BackToListLink } from "@/components/ui/back-to-list-link";
import { TransitionLink } from "@/components/ui/transition-link";
import { JsonLd } from "@/components/seo/json-ld";
import { EventActionBar } from "@/features/events/components/detail/event-action-bar";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import { EventDetailTracking } from "@/features/events/components/detail/event-detail-tracking";
import { EventFactList } from "@/features/events/components/detail/event-fact-list";
import { EventImage } from "@/features/events/components/event-image";
import { EventImagePlaceholder } from "@/features/events/components/event-image-placeholder";
import { EventInfoList } from "@/features/events/components/detail/event-info-list";
import { EventPosterViewer } from "@/features/events/components/detail/event-poster-viewer";
import { EventViewCount } from "@/features/events/components/detail/event-view-count";
import { PosterBackdrop } from "@/features/events/components/poster-backdrop";
import { StatusBadges } from "@/features/events/components/status-badges";
import { getAllPublicEvents, getPublicEventBySlug } from "@/features/events/queries";
import { getEventIntroduction } from "@/features/events/model/event";
import { getRelatedEvents } from "@/features/events/model/event-list";
import { formatAudiences } from "@/features/events/model/format";
import { categoryLabels } from "@/features/events/model/taxonomy";
import { eventTopicPath } from "@/features/events/model/topics";
import {
  buildEventBreadcrumbStructuredData,
  buildEventSeoDescription,
  buildEventStructuredData,
} from "@/features/events/seo";
import { getPublicEnv } from "@/lib/env";
import { INDEXABLE_ROBOTS, SITE_NAME, SITE_OPEN_GRAPH_IMAGE_PATH } from "@/lib/seo/site-identity";

export const revalidate = 3600;

export async function generateStaticParams() {
  const events = await getAllPublicEvents();
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) return { title: "행사를 찾을 수 없습니다" };
  const description = buildEventSeoDescription(event);
  const canonicalPath = `/events/${event.slug}`;
  const imageUrl = event.imageUrl?.trim() || null;
  // 포스터가 없으면 사이트 기본 공유 이미지를 쓴다. 페이지가 openGraph를 새로 정하면 루트의 기본 이미지를 물려받지 못해
  // 공유 미리보기 그림이 비었다(운영 HTML에서 확인, 2026-11-15 사용자 결정).
  const images = imageUrl
    ? [{ url: imageUrl, alt: `${event.title} 행사 대표 이미지` }]
    : [{ url: SITE_OPEN_GRAPH_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} 로고` }];
  return {
    title: `${event.title} 일정·장소·신청 안내`,
    description,
    alternates: { canonical: canonicalPath },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: canonicalPath,
      siteName: SITE_NAME,
      title: event.title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images,
    },
  };
}

const sectionTitleClassName = "text-title-2 text-content-strong";
// 본문 아래 구역(비슷한 행사, 목록으로)은 구분선 없이 여백으로만 나눈다(구분선은 번잡해 보였음, 2026-11-07 사용자 결정).
const lowerSectionClassName = "mt-14 px-4 lg:px-0";

// 페이지는 데이터를 불러와 부품을 조립한다. 핵심 정보·행사 정보·행동 바·포스터 배경은 features/events/components에 있다(2026-11-07 나눔).
export default async function EventDetailPage({ params }: PageProps<"/events/[slug]">) {
  const [{ slug }, allEvents] = await Promise.all([params, getAllPublicEvents()]);
  const event = allEvents.find((item) => item.slug === slug) ?? null;
  if (!event) notFound();

  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const eventJsonLd = buildEventStructuredData(event, siteUrl);
  const breadcrumbJsonLd = buildEventBreadcrumbStructuredData(event, siteUrl);
  const relatedEvents = getRelatedEvents(event, allEvents);
  const introduction = getEventIntroduction(event);
  const renderedAt = new Date().toISOString();
  const posterUrl = event.imageUrl?.trim() || null;

  return (
    // 하단 행동 바만큼의 여백은 페이지 맨 끝(body)에 둔다(globals.css). 여기에 두면 목록으로 버튼 아래가 너무 비었다(2026-11-07).
    <main id="main-content" className="mx-auto max-w-6xl lg:px-6 lg:pt-6">
      <EventDetailTracking
        slug={event.slug}
        category={event.category}
        audiences={event.audiences}
        applicationAvailable={Boolean(event.applicationUrl)}
      />
      {eventJsonLd !== null && <JsonLd data={eventJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      {/* 맨 위의 "‹ 목록으로 돌아가기". 가볼만한 곳이 생겨 로고만으로는 어느 목록으로 가는지 알 수 없어 둔다(2026-11-21 사용자 결정). */}
      <div className="px-4 pt-1 lg:mb-4 lg:px-0 lg:pt-0">
        <BackToListLink href="/" pendingLabel="행사 목록 불러오는 중" />
      </div>
      {/* 경로는 화면 읽기 프로그램용으로만 둔다. 넓은 화면에서도 보였지만 위 "목록으로 돌아가기"와 겹쳐 숨겼다(2026-11-21).
          안의 링크는 Tab 초점을 받으므로, 초점이 들어오면 보이게 해 보이지 않는 곳에 초점이 머물지 않게 한다(WCAG 2.4.7). */}
      <nav aria-label="현재 위치" className="sr-only text-label font-normal text-content-subtle focus-within:not-sr-only focus-within:block focus-within:px-4 focus-within:py-2 lg:focus-within:px-0">
        <TransitionLink href="/" pendingLabel="행사 목록 불러오는 중" showPendingIndicator={false} className="text-primary-text hover:underline">{SITE_NAME}</TransitionLink>{" "}
        <span aria-hidden="true">/</span>{" "}
        <TransitionLink href={eventTopicPath(event.category)} pendingLabel={`속초 ${categoryLabels[event.category]} 목록 불러오는 중`} showPendingIndicator={false} className="text-primary-text hover:underline">속초 {categoryLabels[event.category]}</TransitionLink>{" "}
        <span aria-hidden="true">/</span> {event.title}
      </nav>

      {/* 모바일: 포스터 → 제목·핵심 정보 → 소개 → 행사 정보 순서. lg: 왼쪽 포스터·소개·행사 정보, 오른쪽에 고정된 제목·핵심 정보·버튼. */}
      <article className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-12">
        {/* 같은 포스터를 흐려 배경으로 깔고 가운데에 포스터 전체를 둔다(목록 배너와 같은 방식, 2026-11-06 사용자 결정). */}
        <div className="relative h-60 overflow-hidden bg-content-strong lg:col-start-1 lg:row-start-1 lg:h-128 lg:rounded-card">
          <PosterBackdrop imageUrl={event.imageUrl} />
          <div className="absolute inset-4 lg:inset-6">
            <EventImage src={event.imageUrl} alt={event.title} priority fit="contain" sizes="(min-width: 1024px) 640px, 100vw" fallback={<EventImagePlaceholder />} />
          </div>
          {/* 기본 포스터는 크게 볼 내용이 없어 실제 포스터가 있을 때만 크게 보기를 둔다(2026-11-18 사용자 결정). */}
          {posterUrl !== null && <EventPosterViewer imageUrl={posterUrl} title={event.title} slug={event.slug} category={event.category} />}
        </div>

        <div className="px-4 pt-5 lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:px-0 lg:pt-0">
          {/* 분야 글자와 배지 묶음 사이는 12px로 띄운다(8px은 붙어 보였음, 2026-11-07 사용자 결정). */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {/* 참여 대상이 비어 있으면(수집 데이터) 분야만 쓴다. DB는 빈 값을 허용하고 관리자 폼만 막는다. */}
            <p className="text-caption font-medium text-primary-text">{[categoryLabels[event.category], formatAudiences(event.audiences)].filter(Boolean).join(" · ")}</p>
            <StatusBadges event={event} />
            {/* 조회수는 분야 줄 오른쪽 끝에 아이콘 없이 작게 둔다(모바일·PC 같음, 2026-11-07 사용자 결정). */}
            <EventViewCount value={event.viewCount} className="ml-auto text-caption text-content-subtle" />
          </div>
          <h1 className="mt-2 text-title-1 text-content-strong lg:text-title-1-lg">{event.title}</h1>
          <EventFactList event={event} renderedAt={renderedAt} />
          <EventActionBar event={event} />
        </div>

        {Boolean(introduction) && (
          <section aria-labelledby="introduction-title" className="mt-10 px-4 lg:col-start-1 lg:mt-10 lg:px-0">
            <h2 id="introduction-title" className={sectionTitleClassName}>소개</h2>
            <p className="mt-3 max-w-160 whitespace-pre-line text-body text-content">{introduction}</p>
          </section>
        )}

        <EventInfoList event={event} />
      </article>

      {/* 예전의 "주변 명소" 구역은 뺐다. 행사 상세에는 행사에 필요한 정보만 두고, 장소는 "가볼만한 곳" 탭과 지도에서 찾는다(2026-11-21 사용자 결정). */}
      {relatedEvents.length > 0 && (
        <section aria-labelledby="related-title" className={lowerSectionClassName}>
          <h2 id="related-title" className={sectionTitleClassName}>이 행사도 살펴보세요</h2>
          {/* 명소와 같은 방식으로 노출을 센다. 명소를 안 누른 이유가 "아래까지 안 내려와서"인지 비교하는 기준이다(2026-11-07). */}
          <AnalyticsViewTracking name="related_events_viewed" properties={{ event_category: event.category }}>
            <div className={`mt-4 ${eventCardGridClassName}`}>{relatedEvents.map((item) => <EventCard key={item.id} event={item} contentSource="related_events" />)}</div>
          </AnalyticsViewTracking>
        </section>
      )}

      <div className={`${lowerSectionClassName} flex justify-center`}>
        {/* 버튼 모양 링크의 모서리 스피너는 글자 옆 "["처럼 보여 쓰지 않는다(2026-11-07 관리자 버튼과 같은 결정, BackToListLink). */}
        <BackToListLink href="/" pendingLabel="행사 목록 불러오는 중" appearance="button" />
      </div>
    </main>
  );
}
