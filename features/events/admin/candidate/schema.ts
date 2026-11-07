// 수집 후보(JSON 가져오기) 한 건의 형식과 검증. 관리자 가져오기에서만 쓰므로 공개 model이 아니라 admin에 둔다(2026-11-06).
// 가져오기의 action·저장 payload와 함께 admin/candidate/ 폴더에 모았다(2026-11-07).
import { z } from "zod";
import { isLikelyEventDetailUrl } from "@/features/events/model/source-url";
import { eventAudiences, eventCategories, type EventAudience, type EventCategory } from "@/features/events/model/taxonomy";
import { httpUrlSchema } from "@/lib/url";

export interface EventCandidate {
  title: string;
  summary: string | null;
  description: string | null;
  category: EventCategory | null;
  audiences: EventAudience[];
  eventStartAt: string | null;
  eventEndAt: string | null;
  operatingHours: string | null;
  applicationStartAt: string | null;
  applicationEndAt: string | null;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  priceText: string | null;
  isFree: boolean | null;
  organizer: string | null;
  contact: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
}

const nullableUrl = httpUrlSchema.nullable();
const nullableDateTime = z.string().datetime({ offset: true }).nullable();

export const eventCandidateSchema: z.ZodType<EventCandidate> = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).nullable(),
  description: z.string().trim().max(5_000).nullable(),
  category: z.enum(eventCategories).nullable(),
  audiences: z.array(z.enum(eventAudiences)).max(eventAudiences.length),
  eventStartAt: nullableDateTime,
  eventEndAt: nullableDateTime,
  operatingHours: z.string().trim().max(300).nullable(),
  applicationStartAt: nullableDateTime,
  applicationEndAt: nullableDateTime,
  locationName: z.string().trim().max(200).nullable(),
  address: z.string().trim().max(300).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  priceText: z.string().trim().max(200).nullable(),
  isFree: z.boolean().nullable(),
  organizer: z.string().trim().max(200).nullable(),
  contact: z.string().trim().max(200).nullable(),
  officialUrl: nullableUrl,
  applicationUrl: nullableUrl,
  imageUrl: nullableUrl,
  sourceName: z.string().trim().min(1).max(200),
  sourceUrl: httpUrlSchema.refine(isLikelyEventDetailUrl, "기관 대표 홈이나 목록이 아닌 행사별 공식 원문 URL을 입력하세요."),
}).superRefine((candidate, context) => {
  // DB 제약(events_time_order, events_application_order, events_coordinates_pair)과 같은 검사.
  if (candidate.eventEndAt && !candidate.eventStartAt) {
    context.addIssue({ code: "custom", path: ["eventStartAt"], message: "eventEndAt이 있으면 eventStartAt도 필요합니다." });
  }
  if (candidate.eventStartAt && candidate.eventEndAt && new Date(candidate.eventEndAt) < new Date(candidate.eventStartAt)) {
    context.addIssue({ code: "custom", path: ["eventEndAt"], message: "eventEndAt은 eventStartAt보다 빠를 수 없습니다." });
  }
  if (candidate.applicationStartAt && candidate.applicationEndAt
    && new Date(candidate.applicationEndAt) < new Date(candidate.applicationStartAt)) {
    context.addIssue({ code: "custom", path: ["applicationEndAt"], message: "applicationEndAt은 applicationStartAt보다 빠를 수 없습니다." });
  }
  if ((candidate.latitude === null) !== (candidate.longitude === null)) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "latitude와 longitude는 함께 입력하거나 함께 비워야 합니다." });
  }
});

/** 관리자 화면에 붙여 넣은 후보 JSON 문자열을 읽어 검증한다. JSON 문법 오류와 형식 오류를 같은 칸 오류로 돌려준다. */
export const candidateJsonSchema = z.string().min(2).transform((value, context) => {
  try {
    return eventCandidateSchema.parse(JSON.parse(value));
  } catch (error) {
    context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "JSON을 확인하세요." });
    return z.NEVER;
  }
});
