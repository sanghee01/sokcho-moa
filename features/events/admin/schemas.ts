import { z } from "zod";
import { seoulDateOrDatetimeToIso } from "@/features/events/admin/datetime";
import { eventScheduleModes } from "@/features/events/model/event";
import { eventAudiences, eventCategories } from "@/features/events/model/taxonomy";
import { optionalTextField, optionalUrlField } from "@/lib/form-data";
import { createHttpUrlSchema, isHttpUrl } from "@/lib/url";
import { slugSchema } from "@/lib/slug";

const eventSourceUrlSchema = createHttpUrlSchema({
  invalidUrl: "올바른 행사 안내 URL을 입력하세요.",
  unsupportedProtocol: "HTTPS 행사 안내 URL을 입력하세요.",
});
const requiredHttpsUrl = z.string()
  .trim()
  .min(1, "행사 안내 URL을 입력하세요.")
  .pipe(eventSourceUrlSchema)
  .refine(
    (value) => isHttpUrl(value) && new URL(value).protocol === "https:",
    "HTTPS 행사 안내 URL을 입력하세요.",
  );
function optionalDate(dateOnlyBoundary: "start" | "end" = "start") {
  return z.string().trim().transform((value, context) => {
    if (!value) return null;
    try {
      return seoulDateOrDatetimeToIso(value, dateOnlyBoundary);
    } catch {
      context.addIssue({ code: "custom", message: "올바른 날짜를 입력하세요." });
      return z.NEVER;
    }
  });
}

const optionalStartDate = optionalDate();
const optionalEndDate = optionalDate("end");

const occurrenceSchema = z.object({
  startsAt: optionalStartDate,
  endsAt: optionalEndDate,
});

export const eventFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().pipe(slugSchema),
  title: z.string().trim().min(1, "행사명을 입력하세요.").max(200),
  introduction: optionalTextField.pipe(z.string().max(5_000, "행사 소개는 5,000자 이하로 입력하세요.").nullable()),
  category: z.enum(eventCategories),
  audiences: z.array(z.enum(eventAudiences)).min(1, "참여 대상을 한 개 이상 선택하세요."),
  eventStartAt: optionalStartDate,
  eventEndAt: optionalEndDate,
  operatingHours: optionalTextField,
  scheduleMode: z.enum(eventScheduleModes).default("continuous"),
  occurrences: z.array(occurrenceSchema).max(100, "운영 회차는 한 번에 100개까지 저장할 수 있습니다.").default([]),
  applicationStartAt: optionalStartDate,
  applicationEndAt: optionalEndDate,
  locationName: optionalTextField,
  address: optionalTextField,
  priceText: optionalTextField,
  isFree: z.enum(["true", "false", "unknown"]).transform((value) => value === "unknown" ? null : value === "true"),
  performerPeople: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  performerGroups: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  organizer: optionalTextField,
  organizerUrl: optionalUrlField.optional().transform((value) => value ?? null),
  contact: optionalTextField,
  applicationUrl: optionalUrlField,
  imageUrl: optionalUrlField,
  sourceName: z.string().trim().min(1, "출처 기관을 입력하세요.").max(200),
  sourceUrl: requiredHttpsUrl,
  isFeatured: z.boolean(),
}).superRefine((event, context) => {
  // 아래 검사는 DB 제약(events_time_order, events_application_order, event_occurrences_unique_start)과 같다.
  // 저장 전에 이유를 알려 주지 않으면 "잠시 후 다시 시도"라는 일반 오류만 나고 다시 해도 성공하지 않는다.
  if (event.eventEndAt && !event.eventStartAt) {
    context.addIssue({ code: "custom", path: ["eventStartAt"], message: "행사 종료를 입력하려면 시작 일시도 입력하세요." });
  }
  if (event.eventStartAt && event.eventEndAt && new Date(event.eventEndAt) < new Date(event.eventStartAt)) {
    context.addIssue({ code: "custom", path: ["eventEndAt"], message: "행사 종료는 시작보다 빠를 수 없습니다." });
  }
  if (event.applicationStartAt && event.applicationEndAt && new Date(event.applicationEndAt) < new Date(event.applicationStartAt)) {
    context.addIssue({ code: "custom", path: ["applicationEndAt"], message: "신청 마감은 신청 시작보다 빠를 수 없습니다." });
  }
  const occurrenceStarts = event.occurrences.map((occurrence) => occurrence.startsAt).filter(Boolean);
  if (new Set(occurrenceStarts).size !== occurrenceStarts.length) {
    context.addIssue({ code: "custom", path: ["occurrences"], message: "시작 일시가 같은 회차가 두 번 이상 있습니다." });
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
