import {
  categoryLabels,
  eventCategories,
  type EventCategory,
} from "@/features/events/model/taxonomy";

export type EventTopic = {
  category: EventCategory;
  slug: EventCategory;
  path: `/topics/${EventCategory}`;
  label: string;
  title: string;
  heading: string;
  description: string;
};

const topicCopy: Record<
  EventCategory,
  Pick<EventTopic, "title" | "heading" | "description">
> = {
  performance: {
    title: "속초 공연 일정·예매 정보",
    heading: "속초 공연 한눈에 보기",
    description: "속초에서 열리는 공연과 콘서트, 버스킹 일정을 날짜·장소·예매 정보와 함께 확인하세요.",
  },
  festival: {
    title: "속초 축제 일정·기간·장소",
    heading: "속초 축제 한눈에 보기",
    description: "속초에서 열리는 축제와 페스티벌의 일정, 기간, 장소와 이용 정보를 한곳에서 확인하세요.",
  },
  experience: {
    title: "속초 체험 프로그램 일정·신청 정보",
    heading: "속초 체험 프로그램 한눈에 보기",
    description: "속초의 가족·아동·청소년 체험 프로그램을 일정, 장소, 대상과 신청 정보로 비교하세요.",
  },
  education: {
    title: "속초 교육·강좌 일정·신청 정보",
    heading: "속초 교육·강좌 한눈에 보기",
    description: "속초의 교육 프로그램과 문화 강좌를 일정, 대상, 장소와 신청 정보로 확인하세요.",
  },
  exhibition: {
    title: "속초 전시 일정·관람 정보",
    heading: "속초 전시 한눈에 보기",
    description: "속초에서 열리는 전시와 기획전을 기간, 장소, 관람 대상과 이용 정보로 확인하세요.",
  },
  other: {
    title: "속초 행사·이벤트 일정",
    heading: "속초의 다양한 행사 한눈에 보기",
    description: "공연·축제·체험·교육·전시 외 속초의 다양한 행사와 이벤트 일정을 확인하세요.",
  },
};

export const eventTopics: readonly EventTopic[] = eventCategories.map((category) => ({
  category,
  slug: category,
  path: `/topics/${category}`,
  label: categoryLabels[category],
  ...topicCopy[category],
}));

export function findEventTopicBySlug(slug: string) {
  return eventTopics.find((topic) => topic.slug === slug);
}

export function findEventTopicByCategory(category: string | undefined) {
  return eventTopics.find((topic) => topic.category === category);
}

export function eventTopicPath(category: EventCategory) {
  return `/topics/${category}` as const;
}
