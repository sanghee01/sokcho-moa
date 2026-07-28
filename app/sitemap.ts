import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/config/env";
import { getAllPublicEvents } from "@/lib/data/events";
import { eventTopics } from "@/lib/domain/event-topic";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const events = await getAllPublicEvents();
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...eventTopics.map((topic) => ({
      url: `${baseUrl}${topic.path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...events.map((event) => ({
      url: `${baseUrl}/events/${event.slug}`,
      lastModified: new Date(event.lastVerifiedAt ?? event.publishedAt ?? event.eventStartAt),
      changeFrequency: "daily" as const,
      priority: event.isFeatured ? 0.9 : 0.7,
    })),
  ];
}
