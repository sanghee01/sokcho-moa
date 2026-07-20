import { z } from "zod";
import { seoulDatetimeLocalToIso } from "@/lib/admin/datetime";
import { eventAudiences, eventCandidateSchema, eventCategories } from "@/lib/domain/event";
import { isLikelyEventDetailUrl } from "@/lib/domain/source";

const optionalText = z.string().trim().transform((value) => value || null);
const optionalUrl = z.string().trim().transform((value, context) => {
  if (!value) return null;
  const parsed = z.string().url().safeParse(value);
  if (!parsed.success) {
    context.addIssue({ code: "custom", message: "올바른 URL을 입력하세요." });
    return z.NEVER;
  }
  return parsed.data;
});
const optionalDate = z.string().trim().transform((value, context) => {
  if (!value) return null;
  try {
    return seoulDatetimeLocalToIso(value);
  } catch {
    context.addIssue({ code: "custom", message: "올바른 날짜와 시간을 입력하세요." });
    return z.NEVER;
  }
});

const occurrenceSchema = z.object({
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const eventFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "영문 소문자·숫자·하이픈만 사용하세요."),
  title: z.string().trim().min(1).max(200),
  summary: optionalText,
  description: optionalText,
  category: z.enum(eventCategories),
  audiences: z.array(z.enum(eventAudiences)).min(1),
  eventStartAt: optionalDate,
  eventEndAt: optionalDate,
  operatingHours: optionalText,
  scheduleMode: z.enum(["continuous", "occurrences"]).default("continuous"),
  occurrences: z.array(occurrenceSchema).max(100, "운영 회차는 한 번에 100개까지 저장할 수 있습니다.").default([]),
  applicationStartAt: optionalDate,
  applicationEndAt: optionalDate,
  locationName: optionalText,
  address: optionalText,
  latitude: z.coerce.number().min(-90).max(90).nullable(),
  longitude: z.coerce.number().min(-180).max(180).nullable(),
  locationSourceUrl: optionalUrl,
  locationVerifiedAt: optionalDate,
  priceText: optionalText,
  isFree: z.enum(["true", "false", "unknown"]).transform((value) => value === "unknown" ? null : value === "true"),
  organizer: optionalText,
  contact: optionalText,
  officialUrl: optionalUrl,
  applicationUrl: optionalUrl,
  imageUrl: optionalUrl,
  sourceName: z.string().trim().min(1).max(200),
  sourceUrl: z.string().trim().url().refine(isLikelyEventDetailUrl, "기관 대표 홈이나 목록이 아닌 행사별 공식 원문 URL을 입력하세요."),
  isFeatured: z.boolean(),
  lastVerifiedAt: optionalDate,
}).superRefine((event, context) => {
  if (event.eventStartAt && event.eventEndAt && new Date(event.eventEndAt) < new Date(event.eventStartAt)) {
    context.addIssue({ code: "custom", path: ["eventEndAt"], message: "행사 종료는 시작보다 빠를 수 없습니다." });
  }

  if (event.scheduleMode === "occurrences" && event.occurrences.length === 0) {
    context.addIssue({ code: "custom", path: ["occurrences"], message: "실제 운영 회차를 한 개 이상 입력해 주세요." });
  }
  event.occurrences.forEach((occurrence, index) => {
    if (!occurrence.startsAt) {
      context.addIssue({ code: "custom", path: ["occurrences", index, "startsAt"], message: "회차 시작 일시를 입력해 주세요." });
      return;
    }
    if (occurrence.endsAt && new Date(occurrence.endsAt) < new Date(occurrence.startsAt)) {
      context.addIssue({ code: "custom", path: ["occurrences", index, "endsAt"], message: "회차 종료는 시작보다 빠를 수 없습니다." });
    }
  });

  const hasLatitude = event.latitude != null;
  const hasLongitude = event.longitude != null;
  if (hasLatitude !== hasLongitude) {
    context.addIssue({ code: "custom", path: [hasLatitude ? "longitude" : "latitude"], message: "위도와 경도를 모두 입력하거나 모두 비워 주세요." });
  }

  const hasLocationSource = event.locationSourceUrl != null;
  const hasLocationVerifiedAt = event.locationVerifiedAt != null;
  if (hasLocationSource !== hasLocationVerifiedAt) {
    context.addIssue({ code: "custom", path: [hasLocationSource ? "locationVerifiedAt" : "locationSourceUrl"], message: "위치 근거 URL과 위치 확인 시각을 함께 입력해 주세요." });
  }
  if ((hasLocationSource || hasLocationVerifiedAt) && (!hasLatitude || !hasLongitude)) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "위치 근거를 등록하려면 위도와 경도가 모두 필요합니다." });
  }
});

export const placeFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  summary: optionalText,
  address: optionalText,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  imageUrl: optionalUrl,
  officialUrl: optionalUrl,
  mapUrl: optionalUrl,
  isPublished: z.boolean(),
});

export const candidateJsonSchema = z.string().min(2).transform((value, context) => {
  try {
    return eventCandidateSchema.parse(JSON.parse(value));
  } catch (error) {
    context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "JSON을 확인하세요." });
    return z.NEVER;
  }
});
