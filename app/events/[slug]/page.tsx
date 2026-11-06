import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, ExternalLink, MapPin, PenLine, Ticket } from "lucide-react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import { EventDetailAnalytics } from "@/features/events/components/event-detail-analytics";
import { EventImage } from "@/features/events/components/event-image";
import { EventImagePlaceholder } from "@/features/events/components/event-image-placeholder";
import { EventViewCount } from "@/features/events/components/event-view-count";
import { PlaceCard } from "@/features/places/components/place-card";
import { ShareEventButton } from "@/features/events/components/share-event-button";
import { StatusBadges } from "@/features/events/components/status-badges";
import { LiveApplicationStateLabel } from "@/features/events/components/live-event-status";
import { pickEventStatusFields } from "@/features/events/model/status-fields";
import { getAllPublicEvents, getPublicEventBySlug } from "@/features/events/queries";
import { getPublicPlaces } from "@/features/places/queries";
import {
  applicationStateLabels,
  audienceLabels,
  categoryLabels,
  formatApplicationPeriod,
  formatOperatingSchedule,
  formatShortDateRange,
} from "@/features/events/model/format";
import { getEventIntroduction, getRelatedEvents } from "@/features/events/model/event";
import { eventTopicPath } from "@/features/events/model/topics";
import { createEventMapLinks, findNearbyPlaces, getNearbyPlacesLabel } from "@/features/events/model/location";
import { analyticsData } from "@/lib/analytics/events";
import { getPublicEnv } from "@/lib/env";
import {
  buildEventBreadcrumbStructuredData,
  buildEventSeoDescription,
  buildEventStructuredData,
} from "@/features/events/seo";
import { INDEXABLE_ROBOTS, SITE_NAME } from "@/lib/seo/site-identity";
import { JsonLd } from "@/components/seo/json-ld";

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

/** 핵심 정보 한 행. 라벨은 화면 읽기 프로그램용으로 남기고, 화면에는 아이콘과 값만 보인다(.ai/DESIGN.md Components > FactList). */
function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
      <span className="mt-0.5 shrink-0 text-content-subtle">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 flex-1 text-body text-content-strong">{children}</dd>
    </div>
  );
}

/** 행사 정보 묶음의 한 행(라벨이 보이는 목록) */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 border-t border-line py-3 first:border-t-0">
      <dt className="text-label font-normal text-content-subtle">{label}</dt>
      <dd className="min-w-0 text-label font-normal text-content-strong">{children}</dd>
    </div>
  );
}

const sectionTitleClassName = "text-title-2 text-content-strong";

export default async function EventDetailPage({ params }: PageProps<"/events/[slug]">) {
  const [{ slug }, allEvents, places] = await Promise.all([params, getAllPublicEvents(), getPublicPlaces()]);
  const event = allEvents.find((item) => item.slug === slug) ?? null;
  if (!event) notFound();

  const nearbyPlaces = findNearbyPlaces(event, places);
  const nearbyPlacesLabel = getNearbyPlacesLabel(event);
  const relatedEvents = getRelatedEvents(event, allEvents);
  const renderedAt = new Date().toISOString();
  const mapLinks = createEventMapLinks(
    event.locationName ?? event.title,
    event.address,
    event.latitude,
    event.longitude,
  );
  const eventJsonLd = buildEventStructuredData(event, getPublicEnv().NEXT_PUBLIC_SITE_URL);
  const breadcrumbJsonLd = buildEventBreadcrumbStructuredData(event, getPublicEnv().NEXT_PUBLIC_SITE_URL);
  const topicPath = eventTopicPath(event.category);
  const introduction = getEventIntroduction(event);
  const applicationPeriod = formatApplicationPeriod(event.applicationStartAt, event.applicationEndAt);
  const audiences = event.audiences.map((audience) => audienceLabels[audience]).join(" · ");
  const price = event.priceText ?? (event.isFree ? "무료" : "요금은 원문에서 확인해 주세요");

  return (
    // 모바일은 하단 행동 바가 본문 끝을 가리지 않게 아래 여백을 둔다.
    <main id="main-content" className="mx-auto max-w-6xl pb-28 lg:px-6 lg:pb-16 lg:pt-6">
      <EventDetailAnalytics
        slug={event.slug}
        category={event.category}
        audiences={event.audiences}
        applicationAvailable={Boolean(event.applicationUrl)}
      />
      {eventJsonLd && <JsonLd data={eventJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      {/* 경로는 모바일 첫 화면을 쓰지 않도록 화면 읽기 프로그램용으로만 두고, 넓은 화면에서 보여 준다(.ai/DESIGN.md 행사 상세 7). */}
      <nav aria-label="현재 위치" className="sr-only text-label font-normal text-content-subtle lg:not-sr-only lg:mb-6 lg:block">
        <Link href="/" className="text-primary-text hover:underline">속초모아</Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <Link href={topicPath} className="text-primary-text hover:underline">속초 {categoryLabels[event.category]}</Link>{" "}
        <span aria-hidden="true">/</span> {event.title}
      </nav>

      {/* 모바일: 포스터 → 제목·핵심 정보 → 소개 → 행사 정보 순서. lg: 왼쪽 포스터·소개·행사 정보, 오른쪽에 고정된 제목·핵심 정보·버튼. */}
      <article className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-12">
        {/* 같은 포스터를 흐려 배경으로 깔고 가운데에 포스터 전체를 둔다(목록 배너와 같은 방식, 2026-11-06 사용자 결정). */}
        <div className="relative h-60 overflow-hidden bg-content-strong lg:col-start-1 lg:row-start-1 lg:h-128 lg:rounded-card">
          <div aria-hidden="true" className="absolute inset-0 scale-125 blur-2xl">
            <EventImage src={event.imageUrl} alt="" sizes="20vw" fallback={<EventImagePlaceholder />} />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-image-scrim" />
          <div className="absolute inset-4 lg:inset-6">
            <EventImage src={event.imageUrl} alt={event.title} priority fit="contain" sizes="(min-width: 1024px) 640px, 100vw" fallback={<EventImagePlaceholder />} />
          </div>
        </div>

        <div className="px-4 pt-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:px-0 lg:pt-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <p className="text-caption font-medium text-primary-text">{categoryLabels[event.category]} · {audiences}</p>
            <StatusBadges event={event} />
          </div>
          <h1 className="mt-2 text-title-1 text-content-strong lg:text-title-1-lg">{event.title}</h1>

          <section aria-labelledby="facts-title" className="mt-5">
            <h2 id="facts-title" className="sr-only">핵심 정보</h2>
            <dl>
              <Fact icon={<CalendarDays {...iconProps} />} label="날짜">
                <span className="tabular-nums">{formatShortDateRange(event.eventStartAt, event.eventEndAt)}</span>
              </Fact>
              {event.operatingHours?.trim() && (
                <Fact icon={<Clock {...iconProps} />} label="운영 시간">
                  <span className="whitespace-pre-line">{formatOperatingSchedule(event.operatingHours)}</span>
                </Fact>
              )}
              <Fact icon={<MapPin {...iconProps} />} label="장소">
                <span className="block">{event.locationName ?? "장소는 원문에서 확인해 주세요"}</span>
                {event.address && <span className="mt-0.5 block text-label font-normal text-content-muted">{event.address}</span>}
                {mapLinks && (
                  <a
                    href={mapLinks.naver}
                    target="_blank"
                    rel="noreferrer"
                    {...analyticsData("map_link_clicked", { event_slug: event.slug, event_category: event.category, link_position: "facts_address", map_method: mapLinks.hasCoordinates ? "coordinates" : "search" })}
                    className="mt-1 inline-flex min-h-11 items-center gap-1 text-label font-medium text-primary-text underline decoration-line-strong underline-offset-4 hover:decoration-primary"
                  >
                    네이버 지도 <ExternalLink {...iconProps} size={14} /><span className="sr-only">(새 창)</span>
                  </a>
                )}
              </Fact>
              <Fact icon={<Ticket {...iconProps} />} label="요금">{price}</Fact>
              <Fact icon={<PenLine {...iconProps} />} label="신청">
                {applicationPeriod ? (
                  <>
                    <span className="tabular-nums">{applicationPeriod}</span>
                    {" · "}
                    <span className="font-semibold"><LiveApplicationStateLabel status={pickEventStatusFields(event)} renderedAt={renderedAt} /></span>
                  </>
                ) : applicationStateLabels.not_applicable}
              </Fact>
            </dl>
          </section>

          {/* 행동 버튼은 한 벌만 둔다. 모바일은 화면 아래에 고정하고, lg에서는 핵심 정보 아래에 둔다(.ai/DESIGN.md BottomActionBar).
              한 화면에 primary는 하나다: 신청 링크가 있으면 신청·예매, 없으면 행사 안내. */}
          <div
            data-bottom-action-bar
            className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-floating lg:static lg:z-auto lg:mt-6 lg:border-t-0 lg:bg-transparent lg:p-0 lg:shadow-none"
          >
            {event.applicationUrl && (
              <a
                href={event.applicationUrl}
                target="_blank"
                rel="noreferrer"
                {...analyticsData("application_link_clicked", { event_slug: event.slug, event_category: event.category, link_position: "action_bar" })}
                className={`${getButtonClassName({ variant: "primary" })} min-w-0 flex-1`}
              >
                신청·예매 <span className="sr-only">(새 창)</span>
              </a>
            )}
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              {...analyticsData("source_link_clicked", { event_slug: event.slug, event_category: event.category, link_position: "action_bar", source_type: "primary" })}
              className={`${getButtonClassName({ variant: event.applicationUrl ? "secondary" : "primary" })} ${event.applicationUrl ? "shrink-0" : "min-w-0 flex-1"}`}
            >
              행사 안내 <span className="sr-only">(새 창)</span>
            </a>
            <ShareEventButton slug={event.slug} />
          </div>
        </div>

        {introduction && (
          <section aria-labelledby="introduction-title" className="mt-10 px-4 lg:col-start-1 lg:mt-10 lg:px-0">
            <h2 id="introduction-title" className={sectionTitleClassName}>소개</h2>
            <p className="mt-3 max-w-160 whitespace-pre-line text-body text-content">{introduction}</p>
          </section>
        )}

        <section aria-labelledby="event-info-title" className="mt-10 px-4 lg:col-start-1 lg:px-0">
          <h2 id="event-info-title" className={sectionTitleClassName}>행사 정보</h2>
          <dl className="mt-3 max-w-160">
            <InfoRow label="참여 대상">{audiences}</InfoRow>
            {event.organizer && <InfoRow label="주최·주관">{event.organizer}</InfoRow>}
            {event.contact && <InfoRow label="문의처">{event.contact}</InfoRow>}
            <InfoRow label="조회수"><EventViewCount value={event.viewCount} /></InfoRow>
          </dl>
          <p className="mt-4 max-w-160 text-caption text-content-subtle">
            출처: {event.sourceName}. 방문하거나 신청하기 전에 행사 안내(원문)에서 최신 정보를 확인해 주세요.
          </p>
        </section>
      </article>

      {nearbyPlaces.length > 0 && (
        <section aria-labelledby="nearby-title" className="mt-14 px-4 lg:px-0">
          <h2 id="nearby-title" className={sectionTitleClassName}>{nearbyPlacesLabel.title}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {nearbyPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        </section>
      )}

      {relatedEvents.length > 0 && (
        <section aria-labelledby="related-title" className="mt-14 px-4 lg:px-0">
          <h2 id="related-title" className={sectionTitleClassName}>이 행사도 살펴보세요</h2>
          <div className={`mt-4 ${eventCardGridClassName}`}>{relatedEvents.map((item) => <EventCard key={item.id} event={item} contentSource="related_events" />)}</div>
        </section>
      )}

      <div className="mx-4 mt-14 flex justify-center border-t border-line pt-10 lg:mx-0">
        <Link href="/" className={getButtonClassName({ variant: "secondary", width: "fullOnMobile" })}>
          목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
