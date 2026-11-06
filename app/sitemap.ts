import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";
import { getAllPublicEvents } from "@/features/events/queries";
import { eventTopics } from "@/features/events/model/topics";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const events = await getAllPublicEvents();
  const homeLastModified = latestModifiedAt(events);
  return [
    {
      url: baseUrl,
      ...(homeLastModified ? { lastModified: homeLastModified } : {}),
      changeFrequency: "daily",
      priority: 1,
      images: [`${baseUrl}/icon.jpeg`],
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
function eventModifiedAt(event: Awaited<ReturnType<typeof getAllPublicEvents>>[number]) {
  const candidates = [event.lastVerifiedAt, event.publishedAt]
    .map((value) => (value ? new Date(value) : null))
    .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()));
  if (candidates.length > 0) return new Date(Math.max(...candidates.map((date) => date.getTime())));
  const start = new Date(event.eventStartAt);
  return Number.isNaN(start.getTime()) ? undefined : start;
}

function latestModifiedAt(events: Awaited<ReturnType<typeof getAllPublicEvents>>) {
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
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    return isHttp && url.origin === siteUrl.origin ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
