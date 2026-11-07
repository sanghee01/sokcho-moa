import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventBrowsePage } from "@/features/events/components/browse/event-browse-page";
import {
  eventTopics,
  findEventTopicBySlug,
} from "@/features/events/model/topics";
import {
  INDEXABLE_ROBOTS,
  SITE_NAME,
  SITE_OPEN_GRAPH_IMAGE_PATH,
} from "@/lib/seo/site-identity";

export const dynamicParams = false;

export function generateStaticParams() {
  return eventTopics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({ params }: PageProps<"/topics/[topic]">): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = findEventTopicBySlug(slug);

  if (!topic) notFound();

  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: topic.path },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: topic.path,
      siteName: SITE_NAME,
      title: topic.title,
      description: topic.description,
      images: [{ url: SITE_OPEN_GRAPH_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} 로고` }],
    },
    twitter: {
      card: "summary_large_image",
      title: topic.title,
      description: topic.description,
      images: [SITE_OPEN_GRAPH_IMAGE_PATH],
    },
  };
}

export default async function TopicPage({ params, searchParams }: PageProps<"/topics/[topic]">) {
  const { topic: slug } = await params;
  const topic = findEventTopicBySlug(slug);
  if (!topic) notFound();

  return <EventBrowsePage searchParams={searchParams} topic={topic} />;
}
