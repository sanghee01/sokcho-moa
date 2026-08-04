"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getSiteFeedbackImageValidationError,
  hasValidSiteFeedbackImageSignature,
  siteFeedbackDeleteSchema,
  siteFeedbackReviewSchema,
  siteFeedbackSchema,
} from "@/lib/domain/feedback";
import { checkPublicSubmissionRateLimit } from "@/lib/security/public-submission-rate-limit";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";
import {
  createServiceRoleSupabaseClient,
  isServiceRoleSupabaseConfigured,
} from "@/lib/supabase/service";

export type SiteFeedbackActionState = {
  error: string | null;
  success: boolean;
};

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function submitSiteFeedbackAction(
  _previousState: SiteFeedbackActionState,
  formData: FormData,
): Promise<SiteFeedbackActionState> {
  const website = value(formData, "website");
  if (website) return { error: null, success: true };

  const parsed = siteFeedbackSchema.safeParse({
    title: value(formData, "title"),
    body: value(formData, "body"),
    linkUrl: value(formData, "linkUrl"),
    website,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "입력 내용을 확인해 주세요.",
      success: false,
    };
  }

  const imageEntry = formData.get("image");
  const image = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;
  if (image) {
    const imageError = getSiteFeedbackImageValidationError(image);
    if (imageError) return { error: imageError, success: false };
  }

  if (!isServiceRoleSupabaseConfigured()) {
    return image
      ? { error: "현재 사진 첨부 기능을 준비 중입니다. 사진을 제외하고 다시 보내 주세요.", success: false }
      : { error: "현재 의견 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.", success: false };
  }

  const rateLimit = await checkPublicSubmissionRateLimit("site_feedback");
  if (!rateLimit.allowed) {
    const retryMinutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60));
    return { error: `요청이 많습니다. 약 ${retryMinutes}분 후 다시 시도해 주세요.`, success: false };
  }

  if (image) {
    if (!(await hasValidSiteFeedbackImageSignature(image))) {
      return { error: "파일 내용과 이미지 형식이 일치하지 않습니다. 다른 사진을 선택해 주세요.", success: false };
    }
  }

  const feedbackId = crypto.randomUUID();
  let imagePath: string | null = null;
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return { error: "현재 의견 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.", success: false };
  }

  if (image) {
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[image.type];
    imagePath = `${feedbackId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage
      .from("feedback-images")
      .upload(imagePath, await image.arrayBuffer(), { contentType: image.type, upsert: false });
    if (uploadError) {
      console.error("Site feedback image upload failed", uploadError.message);
      return { error: "사진을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.", success: false };
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
    return { error: "의견을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.", success: false };
  }

  return { error: null, success: true };
}

export async function setSiteFeedbackReviewStatusAction(input: unknown) {
  const parsed = siteFeedbackReviewSchema.safeParse(input);
  if (!parsed.success) throw new Error("변경할 의견 상태를 확인해 주세요.");
  await requireAdmin();
  const client = await createAuthenticatedSupabaseClient();
  if (!client) throw new Error("Supabase 관리자 연결이 없습니다.");
  const { error } = await client
    .from("site_feedback")
    .update({ review_status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) throw new Error(`의견 상태를 변경하지 못했습니다: ${error.message}`);
  revalidatePath("/admin");
  return { status: parsed.data.status };
}

export async function deleteSiteFeedbackAction(input: unknown) {
  const parsed = siteFeedbackDeleteSchema.safeParse(input);
  if (!parsed.success) throw new Error("삭제할 의견을 확인해 주세요.");
  await requireAdmin();
  const client = await createAuthenticatedSupabaseClient();
  if (!client) throw new Error("Supabase 관리자 연결이 없습니다.");
  const { data: feedback, error: readError } = await client
    .from("site_feedback")
    .select("image_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readError) throw new Error(`삭제할 의견을 불러오지 못했습니다: ${readError.message}`);
  const { error } = await client.from("site_feedback").delete().eq("id", parsed.data.id);
  if (error) throw new Error(`의견을 삭제하지 못했습니다: ${error.message}`);
  if (feedback?.image_path) {
    const { error: imageError } = await client.storage.from("feedback-images").remove([feedback.image_path]);
    if (imageError) console.error("Deleted feedback image cleanup failed", imageError.message);
  }
  revalidatePath("/admin");
  return { deleted: true as const };
}
