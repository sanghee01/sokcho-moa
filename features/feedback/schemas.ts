import { z } from "zod";
import { submissionReviewDecisions } from "@/components/admin/submission-review-status";
import { createHttpUrlSchema } from "@/lib/url";

export const SITE_FEEDBACK_IMAGE_MAX_MB = 3;
export const SITE_FEEDBACK_IMAGE_MAX_BYTES = SITE_FEEDBACK_IMAGE_MAX_MB * 1024 * 1024;

/**
 * 의견 사진의 허용 형식과 저장 확장자. 첨부 칸(accept), 형식 검사, 저장 경로가 모두 이 표를 쓴다(예전에는 세 벌, 2026-11-07).
 * 행사 대표 이미지 규칙(features/events/admin/image-rules.ts)과는 합치지 않는다. 행사는 WebP로 최적화해 공개 bucket에,
 * 의견은 원본 그대로 비공개 bucket에 두는 다른 흐름이라 앞으로 갈라질 수 있다.
 */
export const SITE_FEEDBACK_IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const SITE_FEEDBACK_IMAGE_ACCEPT = Object.keys(SITE_FEEDBACK_IMAGE_EXTENSIONS).join(",");

/** 의견 사진을 두는 비공개 Storage bucket. 방문자 저장(actions.ts), 관리자 조회·삭제가 함께 쓴다. */
export const FEEDBACK_IMAGE_BUCKET = "feedback-images";

export function getSiteFeedbackImageValidationError(file: { size: number; type: string }) {
  if (!Object.hasOwn(SITE_FEEDBACK_IMAGE_EXTENSIONS, file.type)) return "사진은 JPG, PNG, WebP 형식만 첨부할 수 있습니다.";
  if (file.size > SITE_FEEDBACK_IMAGE_MAX_BYTES) return `사진은 ${SITE_FEEDBACK_IMAGE_MAX_MB}MB 이하만 첨부할 수 있습니다.`;
  return null;
}

export async function hasValidSiteFeedbackImageSignature(file: Blob) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  }
  if (file.type === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

const feedbackUrlSchema = createHttpUrlSchema({
  invalidUrl: "링크를 올바른 주소로 입력해 주세요.",
  unsupportedProtocol: "링크를 올바른 주소로 입력해 주세요.",
});

const optionalLinkSchema = z.string()
  .trim()
  .max(2048, "링크가 너무 깁니다.")
  .refine((value) => value.length === 0 || feedbackUrlSchema.safeParse(value).success, "링크를 올바른 주소로 입력해 주세요.");

export const siteFeedbackSchema = z.object({
  title: z.string().trim().min(2, "제목을 2자 이상 입력해 주세요.").max(200, "제목은 200자 이하로 입력해 주세요."),
  body: z.string().trim().min(10, "본문을 10자 이상 입력해 주세요.").max(5000, "본문은 5,000자 이하로 입력해 주세요."),
  linkUrl: optionalLinkSchema,
});

export const siteFeedbackReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(submissionReviewDecisions),
});

export const siteFeedbackDeleteSchema = z.object({
  id: z.string().uuid(),
});
