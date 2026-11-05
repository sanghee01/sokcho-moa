"use server";

import { revalidatePath } from "next/cache";
import { throwActionError } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { siteFeedbackDeleteSchema, siteFeedbackReviewSchema } from "@/features/feedback/schemas";

export async function setSiteFeedbackReviewStatusAction(input: unknown) {
  await requireAdmin();
  const parsed = siteFeedbackReviewSchema.safeParse(input);
  if (!parsed.success) throwActionError("변경할 의견 상태를 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  const { error } = await client
    .from("site_feedback")
    .update({ review_status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) throwActionError("의견 상태를 변경하지 못했습니다.", error);

  revalidatePath("/admin");
  return { status: parsed.data.status };
}

/** 의견을 지운 뒤 첨부 사진도 지운다. 사진 삭제 실패는 의견 삭제를 되돌리지 않고 로그만 남긴다. */
export async function deleteSiteFeedbackAction(input: unknown) {
  await requireAdmin();
  const parsed = siteFeedbackDeleteSchema.safeParse(input);
  if (!parsed.success) throwActionError("삭제할 의견을 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  const { data: feedback, error: readError } = await client
    .from("site_feedback")
    .select("image_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readError) throwActionError("삭제할 의견을 불러오지 못했습니다.", readError);

  const { error } = await client.from("site_feedback").delete().eq("id", parsed.data.id);
  if (error) throwActionError("의견을 삭제하지 못했습니다.", error);

  if (feedback?.image_path) {
    const { error: imageError } = await client.storage.from("feedback-images").remove([feedback.image_path]);
    if (imageError) console.error("Deleted feedback image cleanup failed", imageError.message);
  }
  revalidatePath("/admin");
  return { deleted: true as const };
}
