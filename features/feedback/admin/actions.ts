"use server";

import { revalidatePath } from "next/cache";
import { buttonActionFailed } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { siteFeedbackDeleteSchema, siteFeedbackReviewSchema } from "@/features/feedback/schemas";

export async function setSiteFeedbackReviewStatusAction(input: unknown) {
  await requireAdmin();
  const parsed = siteFeedbackReviewSchema.safeParse(input);
  if (!parsed.success) return buttonActionFailed("변경할 의견 상태를 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  // RLS에 막히거나 이미 삭제된 행이면 오류 없이 0행이므로, 바뀐 행이 있는지 확인한다.
  const { data, error } = await client
    .from("site_feedback")
    .update({ review_status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return buttonActionFailed("의견 상태를 변경하지 못했습니다.", error);
  if (!data?.length) return buttonActionFailed("이미 삭제되었거나 권한이 없는 항목입니다. 목록을 새로고침해 주세요.");

  revalidatePath("/admin");
  return { error: null, status: parsed.data.status };
}

/** 의견을 지운 뒤 첨부 사진도 지운다. 사진 삭제 실패는 의견 삭제를 되돌리지 않고 로그만 남긴다. */
export async function deleteSiteFeedbackAction(input: unknown) {
  await requireAdmin();
  const parsed = siteFeedbackDeleteSchema.safeParse(input);
  if (!parsed.success) return buttonActionFailed("삭제할 의견을 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  const { data: feedback, error: readError } = await client
    .from("site_feedback")
    .select("image_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readError) return buttonActionFailed("삭제할 의견을 불러오지 못했습니다.", readError);

  const { data: deleted, error } = await client.from("site_feedback").delete().eq("id", parsed.data.id).select("id");
  if (error) return buttonActionFailed("의견을 삭제하지 못했습니다.", error);
  if (!deleted?.length) return buttonActionFailed("이미 삭제되었거나 권한이 없는 항목입니다. 목록을 새로고침해 주세요.");

  if (feedback?.image_path) {
    const { error: imageError } = await client.storage.from("feedback-images").remove([feedback.image_path]);
    if (imageError) console.error("Deleted feedback image cleanup failed", imageError.message);
  }
  revalidatePath("/admin");
  return { error: null, deleted: true as const };
}
