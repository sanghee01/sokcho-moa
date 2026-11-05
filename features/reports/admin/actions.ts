"use server";

import { revalidatePath } from "next/cache";
import { throwActionError } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { eventReportDeleteSchema, eventReportReviewSchema } from "@/features/reports/schemas";

export async function setEventReportReviewStatusAction(input: unknown) {
  await requireAdmin();
  const parsed = eventReportReviewSchema.safeParse(input);
  if (!parsed.success) throwActionError("변경할 제보 상태를 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  const { error } = await client
    .from("event_reports")
    .update({ review_status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) throwActionError("제보 상태를 변경하지 못했습니다.", error);

  revalidatePath("/admin");
  return { status: parsed.data.status };
}

export async function deleteEventReportAction(input: unknown) {
  await requireAdmin();
  const parsed = eventReportDeleteSchema.safeParse(input);
  if (!parsed.success) throwActionError("삭제할 제보를 확인해 주세요.");
  const client = await createSessionSupabaseClient();

  const { error } = await client.from("event_reports").delete().eq("id", parsed.data.id);
  if (error) throwActionError("제보를 삭제하지 못했습니다.", error);

  revalidatePath("/admin");
  return { deleted: true as const };
}
