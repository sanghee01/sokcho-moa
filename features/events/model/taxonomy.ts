export const eventCategories = [
  "performance",
  "festival",
  "experience",
  "education",
  "exhibition",
  "other",
] as const;

export const eventAudiences = ["child", "youth", "family", "adult", "all"] as const;

export type EventCategory = (typeof eventCategories)[number];
export type EventAudience = (typeof eventAudiences)[number];

/** 주소·외부 입력 값이 분류인지. 검사와 함께 타입을 좁혀 `as` 캐스팅을 쓰지 않는다(2026-11-07). */
export function isEventCategory(value: string | undefined): value is EventCategory {
  return eventCategories.some((category) => category === value);
}

export function isEventAudience(value: string | undefined): value is EventAudience {
  return eventAudiences.some((audience) => audience === value);
}

export const categoryLabels: Record<EventCategory, string> = {
  performance: "공연",
  festival: "축제",
  experience: "체험",
  education: "교육",
  exhibition: "전시",
  other: "기타",
};

export const audienceLabels: Record<EventAudience, string> = {
  child: "아동",
  youth: "청소년",
  family: "가족",
  adult: "성인",
  all: "누구나",
};
