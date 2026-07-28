import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventBrowsePage } from "@/components/event-browse-page";
import type { EventSearchParams } from "@/lib/domain/event-navigation";
import {
  eventTopics,
  findEventTopicBySlug,
} from "@/lib/domain/event-topic";

type TopicPageProps = {
  params: Promise<{ topic: string }>;
  searchParams: Promise<EventSearchParams>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return eventTopics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = findEventTopicBySlug(slug);

  if (!topic) notFound();

  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: topic.path },
  };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const { topic: slug } = await params;
  const topic = findEventTopicBySlug(slug);
  if (!topic) notFound();

  return <EventBrowsePage searchParams={searchParams} topic={topic} />;
}
