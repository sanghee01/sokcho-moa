import { z } from "zod";
import { seoulDateOrDatetimeToIso } from "@/lib/admin/datetime";
import { eventAudiences, eventCandidateSchema, eventCategories } from "@/lib/domain/event";

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
const requiredHttpsUrl = z.string()
  .trim()
  .min(1, "행사 안내 URL을 입력하세요.")
  .url("올바른 행사 안내 URL을 입력하세요.")
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "HTTPS 행사 안내 URL을 입력하세요.");
const optionalDate = (dateOnlyBoundary: "start" | "end" = "start") => z.string().trim().transform((value, context) => {
  if (!value) return null;
  try {
    return seoulDateOrDatetimeToIso(value, dateOnlyBoundary);
  } catch {
    context.addIssue({ code: "custom", message: "올바른 날짜를 입력하세요." });
    return z.NEVER;
  }
});

const optionalStartDate = optionalDate();
const optionalEndDate = optionalDate("end");

const occurrenceSchema = z.object({
  startsAt: optionalStartDate,
  endsAt: optionalEndDate,
});

export const eventFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "영문 소문자·숫자·하이픈만 사용하세요."),
  title: z.string().trim().min(1, "행사명을 입력하세요.").max(200),
  summary: optionalText,
  description: optionalText,
  category: z.enum(eventCategories),
  audiences: z.array(z.enum(eventAudiences)).min(1, "참여 대상을 한 개 이상 선택하세요."),
  eventStartAt: optionalStartDate,
  eventEndAt: optionalEndDate,
  operatingHours: optionalText,
  scheduleMode: z.enum(["continuous", "occurrences"]).default("continuous"),
  occurrences: z.array(occurrenceSchema).max(100, "운영 회차는 한 번에 100개까지 저장할 수 있습니다.").default([]),
  applicationStartAt: optionalStartDate,
  applicationEndAt: optionalEndDate,
  locationName: optionalText,
  address: optionalText,
  priceText: optionalText,
  isFree: z.enum(["true", "false", "unknown"]).transform((value) => value === "unknown" ? null : value === "true"),
  performerPeople: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  performerGroups: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  organizer: optionalText,
  organizerUrl: optionalUrl.optional().transform((value) => value ?? null),
  contact: optionalText,
  applicationUrl: optionalUrl,
  imageUrl: optionalUrl,
  sourceName: z.string().trim().min(1, "출처 기관을 입력하세요.").max(200),
  sourceUrl: requiredHttpsUrl,
  isFeatured: z.boolean(),
}).superRefine((event, context) => {
  if (event.eventStartAt && event.eventEndAt && new Date(event.eventEndAt) < new Date(event.eventStartAt)) {
    context.addIssue({ code: "custom", path: ["eventEndAt"], message: "행사 종료는 시작보다 빠를 수 없습니다." });
  }

  if (event.scheduleMode === "occurrences" && event.occurrences.length === 0) {
    context.addIssue({ code: "custom", path: ["occurrences"], message: "실제 운영 회차를 한 개 이상 입력해 주세요." });
  }
  event.occurrences.forEach((occurrence, index) => {
    if (!occurrence.startsAt) {
      context.addIssue({ code: "custom", path: ["occurrences", index, "startsAt"], message: "회차 시작 날짜를 입력해 주세요." });
      return;
    }
    if (occurrence.endsAt && new Date(occurrence.endsAt) < new Date(occurrence.startsAt)) {
      context.addIssue({ code: "custom", path: ["occurrences", index, "endsAt"], message: "회차 종료는 시작보다 빠를 수 없습니다." });
    }
  });

});

export type EventFormValues = z.infer<typeof eventFormSchema>;

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
