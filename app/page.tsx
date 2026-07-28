import type { Metadata } from "next";
import { EventBrowsePage } from "@/components/event-browse-page";
import type { EventSearchParams } from "@/lib/domain/event-navigation";
import { findEventTopicByCategory } from "@/lib/domain/event-topic";

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
    };
  }

  return {
    title: "속초 행사·축제 정보",
    description: "속초의 행사·공연·축제·체험·교육·전시 일정을 날짜, 장소와 신청 정보로 한눈에 확인하세요.",
    alternates: { canonical: "/" },
  };
}

export default function HomePage({ searchParams }: HomePageProps) {
  return <EventBrowsePage searchParams={searchParams} />;
}
