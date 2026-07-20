"use server";

import { eventReportSchema } from "@/lib/domain/report";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

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

  const client = createPublicSupabaseClient();
  if (!client) {
    return { error: "현재 제보 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.", success: false };
  }

  const { error } = await client.from("event_reports").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    source_url: parsed.data.sourceUrl || null,
  });
  if (error) {
    console.error("Event report insert failed", error.message);
    return { error: "제보를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.", success: false };
  }

  return { error: null, success: true };
}
