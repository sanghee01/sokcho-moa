import { z } from "zod";
import { createHttpUrlSchema } from "@/lib/domain/url";

export const SITE_FEEDBACK_IMAGE_MAX_MB = 3;
export const SITE_FEEDBACK_IMAGE_MAX_BYTES = SITE_FEEDBACK_IMAGE_MAX_MB * 1024 * 1024;
export const SITE_FEEDBACK_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function getSiteFeedbackImageValidationError(file: { size: number; type: string }) {
  if (!supportedImageTypes.has(file.type)) return "사진은 JPG, PNG, WebP 형식만 첨부할 수 있습니다.";
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
  website: z.string().max(0),
});

export const siteFeedbackReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["reviewed", "rejected"]),
});

export const siteFeedbackDeleteSchema = z.object({
  id: z.string().uuid(),
});

export type SiteFeedbackReviewStatus = "pending" | "reviewed" | "rejected";
