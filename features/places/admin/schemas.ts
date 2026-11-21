import { z } from "zod";
import { optionalTextField, optionalUrlField } from "@/lib/form-data";
import { slugSchema } from "@/lib/slug";
import { activityCategories, activityTags, operationStatuses } from "@/features/places/model/activity";

/** 비워 둘 수 있는 날짜 입력(YYYY-MM-DD). 비어 있으면 null. */
const optionalDateField = z.string().trim().transform((value, context) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    context.addIssue({ code: "custom", message: "날짜를 다시 확인해 주세요." });
    return z.NEVER;
  }
  return value;
});

/** 사진 주소: 바깥 주소(http·https)이거나 우리 사이트에 올린 파일 경로("/places/…"). 비어 있으면 null. */
const optionalImageUrlField = z.string().trim().transform((value, context) => {
  if (!value) return null;
  if (/^\/places\/[a-z0-9-]+\.webp$/.test(value)) return value;
  const parsed = optionalUrlField.safeParse(value);
  if (!parsed.success) {
    context.addIssue({ code: "custom", message: "사진 주소는 http(s) 주소이거나 /places/…webp 경로여야 합니다." });
    return z.NEVER;
  }
  return parsed.data;
});

export const placeFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().pipe(slugSchema),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  summary: optionalTextField,
  address: optionalTextField,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  imageUrl: optionalImageUrlField,
  imageCredit: optionalTextField,
  imageSourceUrl: optionalUrlField,
  imageAlt: optionalTextField,
  officialUrl: optionalUrlField,
  mapUrl: optionalUrlField,
  isPublished: z.boolean(),
  // 아래는 즐길거리 목록·상세에 쓰는 값이다. 분류를 비우면 주변 명소로만 나온다(2026-11-21).
  activityCategory: z.union([z.literal("").transform(() => null), z.enum(activityCategories, { message: "가볼만한 곳 분류를 다시 골라 주세요." })]),
  tags: z.array(z.enum(activityTags)),
  description: optionalTextField,
  hoursSummary: optionalTextField,
  closedSummary: optionalTextField,
  priceSummary: optionalTextField,
  phone: optionalTextField,
  parkingSummary: optionalTextField,
  cautions: optionalTextField,
  bookingUrl: optionalUrlField,
  operationStatus: z.enum(operationStatuses, { message: "운영 상태를 다시 골라 주세요." }),
  statusNote: optionalTextField,
  verifiedOn: optionalDateField,
}).superRefine((place, context) => {
  // 사진은 출처 표시가 조건인 것만 쓴다. 출처 없이 사진만 저장하면 DB 제약에도 막힌다.
  if (place.imageUrl !== null && place.imageCredit === null) {
    context.addIssue({ code: "custom", path: ["imageCredit"], message: "사진을 싣려면 출처 문구를 함께 적어 주세요." });
  }
});

export const placeDeleteSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.literal("delete"),
});
