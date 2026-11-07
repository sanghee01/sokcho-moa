import type { Metadata } from "next";
import { EventBrowsePage } from "@/features/events/components/browse/event-browse-page";
import { findEventTopicByCategory } from "@/features/events/model/topics";
import { firstSearchParam } from "@/lib/search-params";
import {
  HOME_TITLE,
  INDEXABLE_ROBOTS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OPEN_GRAPH_IMAGE_PATH,
} from "@/lib/seo/site-identity";

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const params = await searchParams;
  const topic = findEventTopicByCategory(firstSearchParam(params.category));

  if (topic) {
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

  return {
    title: { absolute: HOME_TITLE },
    description: SITE_DESCRIPTION,
    alternates: { canonical: "/" },
    robots: INDEXABLE_ROBOTS,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: "/",
      siteName: SITE_NAME,
      title: HOME_TITLE,
      description: SITE_DESCRIPTION,
      images: [{ url: SITE_OPEN_GRAPH_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} 로고` }],
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description: SITE_DESCRIPTION,
      images: [SITE_OPEN_GRAPH_IMAGE_PATH],
    },
  };
}

export default function HomePage({ searchParams }: PageProps<"/">) {
  return <EventBrowsePage searchParams={searchParams} />;
}
