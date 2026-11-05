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
