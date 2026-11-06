"use server";

import { revalidatePath } from "next/cache";
import { buttonActionFailed } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { eventReportDeleteSchema, eventReportReviewSchema } from "@/features/reports/schemas";

export async function setEventReportReviewStatusAction(input: unknown) {
  await requireAdmin();
  const parsed = eventReportReviewSchema.safeParse(input);
  if (!parsed.success) return buttonActionFailed("변경할 제보 상태를 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  // RLS에 막히거나 이미 삭제된 행이면 오류 없이 0행이므로, 바뀐 행이 있는지 확인한다.
  const { data, error } = await client
    .from("event_reports")
    .update({ review_status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return buttonActionFailed("제보 상태를 변경하지 못했습니다.", error);
  if (!data?.length) return buttonActionFailed("이미 삭제되었거나 권한이 없는 항목입니다. 목록을 새로고침해 주세요.");

  revalidatePath("/admin");
  return { error: null, status: parsed.data.status };
}

export async function deleteEventReportAction(input: unknown) {
  await requireAdmin();
  const parsed = eventReportDeleteSchema.safeParse(input);
  if (!parsed.success) return buttonActionFailed("삭제할 제보를 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  const { data, error } = await client.from("event_reports").delete().eq("id", parsed.data.id).select("id");
  if (error) return buttonActionFailed("제보를 삭제하지 못했습니다.", error);
  if (!data?.length) return buttonActionFailed("이미 삭제되었거나 권한이 없는 항목입니다. 목록을 새로고침해 주세요.");

  revalidatePath("/admin");
  return { error: null, deleted: true as const };
}
