import type { EventTopic } from "@/features/events/model/topics";
import { SITE_NAME } from "@/lib/seo/site-identity";

export function buildTopicStructuredData(topic: EventTopic, siteUrl: string) {
  const homeUrl = new URL("/", siteUrl).toString();
  const topicUrl = new URL(topic.path, homeUrl).toString();
  const breadcrumbId = `${topicUrl}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${topicUrl}#collection`,
        url: topicUrl,
        name: topic.heading,
        description: topic.description,
        inLanguage: "ko-KR",
        isPartOf: {
          "@id": `${homeUrl}#website`,
        },
        breadcrumb: {
          "@id": breadcrumbId,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: homeUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `속초 ${topic.label}`,
            item: topicUrl,
          },
        ],
      },
    ],
  };
}
