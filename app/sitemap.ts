import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";
import { SITE_LOGO_PATH } from "@/lib/seo/site-identity";
import { isHttpUrl } from "@/lib/url";
import { getAllPublicEvents } from "@/features/events/queries";
import {
  ACTIVITY_LIST_PATH,
  activityCategoryPath,
  activityPlacePath,
  listActivityCategories,
  selectActivityPlaces,
} from "@/features/places/model/activity";
import { selectPlacePhoto } from "@/features/places/model/place-photo";
import { getPublicPlaces } from "@/features/places/queries";
import type { Event } from "@/features/events/model/event";
import { eventTopics } from "@/features/events/model/topics";
import { eventCategories } from "@/features/events/model/taxonomy";
import {
  eventMonthPath,
  getListedEventMonths,
  selectMonthEvents,
} from "@/features/events/model/event-month";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const [events, places] = await Promise.all([getAllPublicEvents(), getPublicPlaces()]);
  // 즐길거리: 운영을 끝낸 곳을 뺀 목록·분류·상세. 확인일(verifiedOn)이 있으면 마지막으로 바뀐 날로 알린다.
  const activityPlaces = selectActivityPlaces(places);
  const homeLastModified = latestModifiedAt(events);
  return [
    {
      url: baseUrl,
      ...(homeLastModified ? { lastModified: homeLastModified } : {}),
      changeFrequency: "daily",
      priority: 1,
      images: [`${baseUrl}${SITE_LOGO_PATH}`],
    },
    ...eventTopics.map((topic) => {
      const lastModified = latestModifiedAt(events.filter((event) => event.category === topic.category));
      return {
        url: `${baseUrl}${topic.path}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "daily" as const,
        priority: 0.8,
      };
    }),
    // 월별 행사 페이지는 이번 달과 다음 달만 넣는다. 지난 달 주소는 열려 있지만 새로 알리지 않는다.
    // 달·분야 페이지는 행사가 있는 것만 넣는다. 빈 페이지는 noindex라 알리지 않는다(2026-11-15 사용자 결정).
    ...getListedEventMonths().flatMap((month) => [
      { month, category: undefined, monthEvents: selectMonthEvents(events, month) },
      ...eventCategories.map((category) => ({ month, category, monthEvents: selectMonthEvents(events, month, category) })),
    ])
      .filter(({ category, monthEvents }) => !category || monthEvents.length > 0)
      .map(({ month, category, monthEvents }) => {
        const lastModified = latestModifiedAt(monthEvents);
        return {
          url: `${baseUrl}${eventMonthPath(month, category)}`,
          ...(lastModified ? { lastModified } : {}),
          changeFrequency: "daily" as const,
          priority: 0.8,
        };
      }),
    // 장소가 없으면 즐길거리 목록은 noindex라 알리지 않는다.
    ...(activityPlaces.length > 0
      ? [
        { url: `${baseUrl}${ACTIVITY_LIST_PATH}`, changeFrequency: "weekly" as const, priority: 0.8 },
        ...listActivityCategories(places).map((category) => ({
          url: `${baseUrl}${activityCategoryPath(category)}`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ]
      : []),
    ...activityPlaces.map((place) => {
      // 우리 사이트에 올린 사진만 이미지 sitemap에 넣는다(바깥 주소는 우리가 알릴 그림이 아니다).
      const photoUrl = sameOriginHttpUrl(selectPlacePhoto(place)?.url ?? null, baseUrl);
      return {
        url: `${baseUrl}${activityPlacePath(place.slug)}`,
        ...(place.verifiedOn ? { lastModified: new Date(`${place.verifiedOn}T00:00:00+09:00`) } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        ...(photoUrl ? { images: [photoUrl] } : {}),
      };
    }),
    ...events.map((event) => {
      const imageUrl = sameOriginHttpUrl(event.imageUrl, baseUrl);
      const lastModified = eventModifiedAt(event);
      return {
        url: `${baseUrl}/events/${event.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "daily" as const,
        priority: event.isFeatured ? 0.9 : 0.7,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      };
    }),
  ];
}

/**
 * 공개 페이지가 마지막으로 바뀐 시각. 확인 시각과 공개 시각 중 더 늦은 값을 쓴다.
 * (먼저 확인하고 나중에 공개한 행사가 공개 전 날짜로 보이지 않게. updated_at은 조회수에도 바뀌어 쓰지 않는다.)
 */
function eventModifiedAt(event: Event) {
  const candidates = [event.lastVerifiedAt, event.publishedAt]
    .map((value) => (value ? new Date(value) : null))
    .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()));
  if (candidates.length > 0) return new Date(Math.max(...candidates.map((date) => date.getTime())));
  const start = new Date(event.eventStartAt);
  return Number.isNaN(start.getTime()) ? undefined : start;
}

function latestModifiedAt(events: Event[]) {
  return events.reduce<Date | undefined>((latest, event) => {
    const modifiedAt = eventModifiedAt(event);
    return modifiedAt && (!latest || modifiedAt > latest) ? modifiedAt : latest;
  }, undefined);
}

function sameOriginHttpUrl(value: string | null, baseUrl: string) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  try {
    const siteUrl = new URL(`${baseUrl}/`);
    const url = new URL(normalized, siteUrl);
    return isHttpUrl(url.href) && url.origin === siteUrl.origin ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
