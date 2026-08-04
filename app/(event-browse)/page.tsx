import type { Metadata } from "next";
import { EventBrowsePage } from "@/components/event-browse-page";
import type { EventSearchParams } from "@/lib/domain/event-navigation";
import { findEventTopicByCategory } from "@/lib/domain/event-topic";
import {
  HOME_TITLE,
  INDEXABLE_ROBOTS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OPEN_GRAPH_IMAGE_PATH,
} from "@/lib/seo/site-identity";

type HomePageProps = {
  searchParams: Promise<EventSearchParams>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const params = await searchParams;
  const topic = findEventTopicByCategory(one(params.category));

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

export default function HomePage({ searchParams }: HomePageProps) {
  return <EventBrowsePage searchParams={searchParams} />;
}
