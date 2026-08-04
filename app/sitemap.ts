import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/config/env";
import { getAllPublicEvents } from "@/lib/data/events";
import { eventTopics } from "@/lib/domain/event-topic";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const events = (await getAllPublicEvents()).filter((event) => !event.isDemo);
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

function eventModifiedAt(event: Awaited<ReturnType<typeof getAllPublicEvents>>[number]) {
  const value = event.lastVerifiedAt ?? event.publishedAt ?? event.eventStartAt;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
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
