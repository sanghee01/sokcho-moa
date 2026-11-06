"use server";

import {
  actionFailed,
  actionSucceeded,
  fieldFailed,
  invalidFormInput,
  type FormActionState,
} from "@/lib/action-state";
import { formString } from "@/lib/form-data";
import { isBotSubmission, openPublicSubmission } from "@/lib/public-submission";
import {
  getSiteFeedbackImageValidationError,
  hasValidSiteFeedbackImageSignature,
  siteFeedbackSchema,
} from "@/features/feedback/schemas";

const UNAVAILABLE = "현재 의견 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.";
const IMAGE_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function selectedImage(formData: FormData) {
  const entry = formData.get("image");
  return entry instanceof File && entry.size > 0 ? entry : null;
}

/** 방문자 서비스 의견. 사진은 비공개 bucket에 올리고, 저장에 실패하면 올린 사진을 지운다. */
export async function submitSiteFeedbackAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (isBotSubmission(formData)) return actionSucceeded();

  const parsed = siteFeedbackSchema.safeParse({
    title: formString(formData, "title"),
    body: formString(formData, "body"),
    linkUrl: formString(formData, "linkUrl"),
  });
  if (!parsed.success) return invalidFormInput(parsed.error);

  const image = selectedImage(formData);
  const imageError = image ? getSiteFeedbackImageValidationError(image) : null;
  if (imageError) return fieldFailed("image", imageError);

  const submission = await openPublicSubmission("site_feedback", UNAVAILABLE);
  if ("error" in submission) return actionFailed(submission.error);
  const { client } = submission;

  if (image && !(await hasValidSiteFeedbackImageSignature(image))) {
    return fieldFailed("image", "파일 내용과 이미지 형식이 일치하지 않습니다. 다른 사진을 선택해 주세요.");
  }

  const feedbackId = crypto.randomUUID();
  const imagePath = image ? `${feedbackId}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[image.type]}` : null;
  if (image && imagePath) {
    const { error: uploadError } = await client.storage
      .from("feedback-images")
      .upload(imagePath, await image.arrayBuffer(), { contentType: image.type, upsert: false });
    if (uploadError) {
      console.error("Site feedback image upload failed", uploadError.message);
      return actionFailed("사진을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  const { error } = await client.from("site_feedback").insert({
    id: feedbackId,
    title: parsed.data.title,
    body: parsed.data.body,
    link_url: parsed.data.linkUrl || null,
    image_path: imagePath,
  });
  if (error) {
    if (imagePath) await client.storage.from("feedback-images").remove([imagePath]);
    console.error("Site feedback insert failed", error.message);
    return actionFailed("의견을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  return actionSucceeded();
}
