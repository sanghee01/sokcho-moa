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
  applicationStartAt: optionalDate,
  applicationEndAt: optionalDate,
  locationName: optionalText,
  address: optionalText,
  latitude: z.coerce.number().min(-90).max(90).nullable(),
  longitude: z.coerce.number().min(-180).max(180).nullable(),
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
