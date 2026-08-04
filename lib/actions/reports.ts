"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { eventReportDeleteSchema, eventReportReviewSchema, eventReportSchema } from "@/lib/domain/report";
import { checkPublicSubmissionRateLimit } from "@/lib/security/public-submission-rate-limit";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";
import {
  createServiceRoleSupabaseClient,
  isServiceRoleSupabaseConfigured,
} from "@/lib/supabase/service";

export type EventReportActionState = {
  error: string | null;
  success: boolean;
};

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function submitEventReportAction(
  _previousState: EventReportActionState,
  formData: FormData,
): Promise<EventReportActionState> {
  const website = value(formData, "website");
  if (website) return { error: null, success: true };

  const parsed = eventReportSchema.safeParse({
    title: value(formData, "title"),
    body: value(formData, "body"),
    sourceUrl: value(formData, "sourceUrl"),
    website,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "입력 내용을 확인해 주세요.",
      success: false,
    };
  }

  if (!isServiceRoleSupabaseConfigured()) {
    return { error: "현재 제보 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.", success: false };
  }

  const rateLimit = await checkPublicSubmissionRateLimit("event_report");
  if (!rateLimit.allowed) {
    const retryMinutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60));
    return { error: `요청이 많습니다. 약 ${retryMinutes}분 후 다시 시도해 주세요.`, success: false };
  }

  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return { error: "현재 제보 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.", success: false };
  }

  const { error } = await client.from("event_reports").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    source_url: parsed.data.sourceUrl,
  });
  if (error) {
    console.error("Event report insert failed", error.message);
    return { error: "제보를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.", success: false };
  }

  return { error: null, success: true };
}

export async function setEventReportReviewStatusAction(input: unknown) {
  const parsed = eventReportReviewSchema.safeParse(input);
  if (!parsed.success) throw new Error("변경할 제보 상태를 확인해 주세요.");
  await requireAdmin();
  const client = await createAuthenticatedSupabaseClient();
  if (!client) throw new Error("Supabase 관리자 연결이 없습니다.");
  const { error } = await client
    .from("event_reports")
    .update({ review_status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) throw new Error(`제보 상태를 변경하지 못했습니다: ${error.message}`);
  revalidatePath("/admin");
  return { status: parsed.data.status };
}

export async function deleteEventReportAction(input: unknown) {
  const parsed = eventReportDeleteSchema.safeParse(input);
  if (!parsed.success) throw new Error("삭제할 제보를 확인해 주세요.");
  await requireAdmin();
  const client = await createAuthenticatedSupabaseClient();
  if (!client) throw new Error("Supabase 관리자 연결이 없습니다.");
  const { error } = await client.from("event_reports").delete().eq("id", parsed.data.id);
  if (error) throw new Error(`제보를 삭제하지 못했습니다: ${error.message}`);
  revalidatePath("/admin");
  return { deleted: true as const };
}
