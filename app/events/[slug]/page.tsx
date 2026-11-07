import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getButtonClassName } from "@/components/ui/button-styles";
import { JsonLd } from "@/components/seo/json-ld";
import { EventActionBar } from "@/features/events/components/event-action-bar";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import { EventDetailTracking } from "@/features/events/components/event-detail-tracking";
import { EventFactList } from "@/features/events/components/event-fact-list";
import { EventImage } from "@/features/events/components/event-image";
import { EventImagePlaceholder } from "@/features/events/components/event-image-placeholder";
import { EventInfoList } from "@/features/events/components/event-info-list";
import { EventViewCount } from "@/features/events/components/event-view-count";
import { PosterBackdrop } from "@/features/events/components/poster-backdrop";
import { StatusBadges } from "@/features/events/components/status-badges";
import { PlaceCard } from "@/features/places/components/place-card";
import { getAllPublicEvents, getPublicEventBySlug } from "@/features/events/queries";
import { getPublicPlaces } from "@/features/places/queries";
import { getEventIntroduction } from "@/features/events/model/event";
import { getRelatedEvents } from "@/features/events/model/event-list";
import { formatAudiences } from "@/features/events/model/format";
import { findNearbyPlaces, getNearbyPlacesTitle } from "@/features/events/model/location";
import { categoryLabels } from "@/features/events/model/taxonomy";
import { eventTopicPath } from "@/features/events/model/topics";
import {
  buildEventBreadcrumbStructuredData,
  buildEventSeoDescription,
  buildEventStructuredData,
} from "@/features/events/seo";
import { getPublicEnv } from "@/lib/env";
import { INDEXABLE_ROBOTS, SITE_NAME } from "@/lib/seo/site-identity";

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
  const images = imageUrl ? [{ url: imageUrl, alt: `${event.title} 행사 대표 이미지` }] : undefined;
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
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

const sectionTitleClassName = "text-title-2 text-content-strong";
// 본문 아래 구역(주변 명소, 비슷한 행사, 목록으로)은 구분선 없이 여백으로만 나눈다(구분선은 번잡해 보였음, 2026-11-07 사용자 결정).
const lowerSectionClassName = "mt-14 px-4 lg:px-0";

// 페이지는 데이터를 불러와 부품을 조립한다. 핵심 정보·행사 정보·행동 바·포스터 배경은 features/events/components에 있다(2026-11-07 나눔).
export default async function EventDetailPage({ params }: PageProps<"/events/[slug]">) {
  const [{ slug }, allEvents, places] = await Promise.all([params, getAllPublicEvents(), getPublicPlaces()]);
  const event = allEvents.find((item) => item.slug === slug) ?? null;
  if (!event) notFound();

  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const eventJsonLd = buildEventStructuredData(event, siteUrl);
  const breadcrumbJsonLd = buildEventBreadcrumbStructuredData(event, siteUrl);
  const nearbyPlaces = findNearbyPlaces(event, places);
  const relatedEvents = getRelatedEvents(event, allEvents);
  const introduction = getEventIntroduction(event);
  const renderedAt = new Date().toISOString();

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
      {/* 경로는 모바일 첫 화면을 쓰지 않도록 화면 읽기 프로그램용으로만 두고, 넓은 화면에서 보여 준다(.ai/DESIGN.md 행사 상세 7). */}
      <nav aria-label="현재 위치" className="sr-only text-label font-normal text-content-subtle lg:not-sr-only lg:mb-6 lg:block">
        <Link href="/" className="text-primary-text hover:underline">{SITE_NAME}</Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <Link href={eventTopicPath(event.category)} className="text-primary-text hover:underline">속초 {categoryLabels[event.category]}</Link>{" "}
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
        </div>

        <div className="px-4 pt-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:px-0 lg:pt-0">
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

      {nearbyPlaces.length > 0 && (
        <section aria-labelledby="nearby-title" className={lowerSectionClassName}>
          <h2 id="nearby-title" className={sectionTitleClassName}>{getNearbyPlacesTitle(event)}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {nearbyPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        </section>
      )}

      {relatedEvents.length > 0 && (
        <section aria-labelledby="related-title" className={lowerSectionClassName}>
          <h2 id="related-title" className={sectionTitleClassName}>이 행사도 살펴보세요</h2>
          <div className={`mt-4 ${eventCardGridClassName}`}>{relatedEvents.map((item) => <EventCard key={item.id} event={item} contentSource="related_events" />)}</div>
        </section>
      )}

      <div className={`${lowerSectionClassName} flex justify-center`}>
        {/* 모바일은 폭 전체, sm부터는 글자 폭만 하면 작아 보여 320px로 둔다(2026-11-07 사용자 결정). */}
        <Link href="/" className={`${getButtonClassName({ variant: "tonal", width: "full" })} sm:w-80`}>
          목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
