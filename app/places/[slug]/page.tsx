import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalyticsMountTracking } from "@/components/analytics/analytics-mount-tracking";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { textLinkClassName } from "@/components/ui/link-styles";
import { BackToListLink } from "@/components/ui/back-to-list-link";
import { TransitionLink } from "@/components/ui/transition-link";
import { EventCard, eventCardGridClassName } from "@/features/events/components/event-card";
import { selectEventsNearPlace } from "@/features/events/model/location";
import { getAllPublicEvents } from "@/features/events/queries";
import { ActivityPlaceRow, activityPlaceListClassName } from "@/features/places/components/activity-place-row";
import { PlaceActions } from "@/features/places/components/place-actions";
import { PlaceFactList } from "@/features/places/components/place-fact-list";
import { PlacePhotoFigure } from "@/features/places/components/place-photo";
import {
  ACTIVITY_LIST_PATH,
  activityCategoryLabels,
  activityCategoryPath,
  activityPlacePath,
  activityTagLabels,
  formatVerifiedOn,
  isActivityPlace,
  operationStatusLabels,
  selectSimilarPlaces,
} from "@/features/places/model/activity";
import { selectPlacePhoto } from "@/features/places/model/place-photo";
import { getVisibleStatusNote } from "@/features/places/model/place-status";
import { getPublicPlaces } from "@/features/places/queries";
import {
  ACTIVITY_LIST_TITLE,
  buildPlaceBreadcrumbStructuredData,
  buildPlaceSeoDescription,
  buildPlaceSeoTitle,
  buildPlaceStructuredData,
} from "@/features/places/seo";
import { getPublicEnv } from "@/lib/env";
import { INDEXABLE_ROBOTS, SITE_NAME, SITE_OPEN_GRAPH_IMAGE_PATH } from "@/lib/seo/site-identity";

export const revalidate = 3600;

async function getActivityPlace(slug: string) {
  const place = (await getPublicPlaces()).find((item) => item.slug === slug);
  return place !== undefined && isActivityPlace(place) ? place : null;
}

export async function generateStaticParams() {
  return (await getPublicPlaces()).filter(isActivityPlace).map((place) => ({ slug: place.slug }));
}

export async function generateMetadata({ params }: PageProps<"/places/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const place = await getActivityPlace(slug);
  if (place === null) return { title: "장소를 찾을 수 없습니다" };
  const title = buildPlaceSeoTitle(place);
  const description = buildPlaceSeoDescription(place);
  const path = activityPlacePath(place.slug);
  const photo = selectPlacePhoto(place);
  // 사진이 없으면 사이트 기본 공유 이미지를 쓴다(행사 상세와 같은 이유: openGraph를 새로 정하면 루트의 기본 이미지를 물려받지 못한다).
  const images = photo !== null
    ? [{ url: photo.url, alt: photo.alt }]
    : [{ url: SITE_OPEN_GRAPH_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} 로고` }];
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: INDEXABLE_ROBOTS,
    openGraph: { type: "website", locale: "ko_KR", url: path, siteName: SITE_NAME, title: place.name, description, images },
    twitter: { card: "summary_large_image", title: place.name, description, images },
  };
}

const sectionTitleClassName = "text-title-2 text-content-strong";
const sectionClassName = "mt-12";

export default async function PlaceDetailPage({ params }: PageProps<"/places/[slug]">) {
  const [{ slug }, places, events] = await Promise.all([params, getPublicPlaces(), getAllPublicEvents()]);
  const found = places.find((item) => item.slug === slug);
  // 가볼만한 곳 분류가 없는 장소는 상세를 열지 않는다. 사이트 어디에도 보이지 않는 곳이고, 채운 정보가 없어 빈 페이지가 된다.
  if (found === undefined || !isActivityPlace(found)) notFound();
  const place = found;

  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const nearbyEvents = selectEventsNearPlace(place, events);
  const similarPlaces = selectSimilarPlaces(place, places);
  const verifiedLabel = formatVerifiedOn(place.verifiedOn);
  const photo = selectPlacePhoto(place);
  const categoryLabel = activityCategoryLabels[place.activityCategory];
  const meta = [categoryLabel, ...place.tags.map((tag) => activityTagLabels[tag])].join(" · ");
  const statusNote = getVisibleStatusNote(place);

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:pt-8">
      <AnalyticsMountTracking name="place_detail_viewed" properties={{ place_slug: place.slug, place_category: place.activityCategory }} onceKey={place.slug} />
      <JsonLd data={buildPlaceStructuredData(place, siteUrl)} />
      <JsonLd data={buildPlaceBreadcrumbStructuredData(place, siteUrl)} />
      {/* 맨 위의 "‹ 목록으로 돌아가기"(행사 상세와 같음, 2026-11-21 사용자 결정). 경로는 화면 읽기 프로그램용으로만 두되,
          안의 링크에 Tab 초점이 들어오면 보이게 한다(WCAG 2.4.7: 보이지 않는 곳에 초점이 머물지 않게). */}
      <div className="-mt-4 mb-3">
        <BackToListLink href={ACTIVITY_LIST_PATH} pendingLabel="가볼만한 곳 목록 불러오는 중" />
      </div>
      <nav aria-label="현재 위치" className="sr-only text-label font-normal text-content-subtle focus-within:not-sr-only focus-within:mb-3 focus-within:block">
        <TransitionLink href={ACTIVITY_LIST_PATH} showPendingIndicator={false} className="text-primary-text hover:underline">{ACTIVITY_LIST_TITLE}</TransitionLink>{" "}
        <span aria-hidden="true">/</span>{" "}
        <TransitionLink href={activityCategoryPath(place.activityCategory)} showPendingIndicator={false} className="text-primary-text hover:underline">{categoryLabel}</TransitionLink>{" "}
        <span aria-hidden="true">/</span> {place.name}
      </nav>

      {/* 글을 읽는 화면이라 본문 최대 폭 40rem. 제목 → 버튼 → 사진 → 핵심 정보 순서다. 사진을 맨 위에 두지 않는 이유:
          사진 없는 장소와 윗부분이 같아지고, 검색으로 들어온 방문자가 제목으로 맞는 페이지인지 먼저 확인하며,
          이 화면의 목표가 핵심 정보와 공식 사이트로 가는 버튼이기 때문이다(2026-11-21). */}
      <article className="max-w-160">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="text-caption font-medium text-primary-text">{meta}</p>
          {place.operationStatus !== "open" && <Badge tone={place.operationStatus === "closed" ? "muted" : "danger"}>{operationStatusLabels[place.operationStatus]}</Badge>}
        </div>
        <h1 className="mt-2 text-title-1 text-content-strong lg:text-title-1-lg">{place.name}</h1>
        {place.summary !== null && <p className="mt-2 text-body text-content-muted">{place.summary}</p>}
        {statusNote !== null && <p className="mt-3 rounded-control bg-surface-subtle px-4 py-3 text-label font-medium text-content-strong">{statusNote}</p>}
        <PlaceActions place={place} />
        {photo !== null && <PlacePhotoFigure photo={photo} />}
        <PlaceFactList place={place} />

        {place.description !== null && (
          <section aria-labelledby="introduction-title" className={sectionClassName}>
            <h2 id="introduction-title" className={sectionTitleClassName}>소개</h2>
            <p className="mt-3 whitespace-pre-line text-body text-content">{place.description}</p>
          </section>
        )}

        {place.cautions.length > 0 && (
          <section aria-labelledby="cautions-title" className={sectionClassName}>
            <h2 id="cautions-title" className={sectionTitleClassName}>가기 전에 확인하세요</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body text-content">
              {place.cautions.map((caution) => <li key={caution}>{caution}</li>)}
            </ul>
          </section>
        )}

        {/* 상시 정보는 조용히 낡는다. 언제 확인한 값인지와 바로잡을 길을 한 줄로 둔다(2026-11-21, Stanford Web Credibility Guidelines 8번).
            "운영시간과 요금은 시즌에 따라 바뀝니다…" 문장은 거의 모든 장소에 되풀이되고 목록 위 안내 띠와 같은 말이라 뺐다(2026-11-21 사용자 결정). */}
        <p className="mt-10 flex flex-wrap items-center gap-x-2 text-caption text-content-subtle">
          {verifiedLabel !== null && <span className="font-medium text-content-muted">{verifiedLabel}</span>}
          <TransitionLink href="/feedback" showPendingIndicator={false} className={textLinkClassName}>정보가 다른가요? 알려 주세요</TransitionLink>
        </p>
      </article>

      {nearbyEvents.length > 0 && (
        <section aria-labelledby="nearby-events-title" className={sectionClassName}>
          <h2 id="nearby-events-title" className={sectionTitleClassName}>근처에서 열리는 행사</h2>
          <div className={`mt-4 ${eventCardGridClassName}`}>{nearbyEvents.map((event) => <EventCard key={event.id} event={event} contentSource="place_detail" />)}</div>
        </section>
      )}

      {similarPlaces.length > 0 && (
        <section aria-labelledby="similar-title" className={sectionClassName}>
          <h2 id="similar-title" className={sectionTitleClassName}>{categoryLabel} 다른 곳</h2>
          <ul className={`mt-3 ${activityPlaceListClassName}`}>
            {similarPlaces.map((item) => <ActivityPlaceRow key={item.id} place={item} showCategory={false} contentSource="similar_places" />)}
          </ul>
        </section>
      )}

      {/* 행사 상세처럼 맨 아래에도 목록으로 돌아가는 버튼을 둔다(2026-11-21 사용자 결정). */}
      <div className={`${sectionClassName} flex justify-center`}>
        <BackToListLink href={ACTIVITY_LIST_PATH} pendingLabel="가볼만한 곳 목록 불러오는 중" appearance="button" />
      </div>
    </main>
  );
}
