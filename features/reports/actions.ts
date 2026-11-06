"use server";

import {
  actionFailed,
  actionSucceeded,
  invalidFormInput,
  type FormActionState,
} from "@/lib/action-state";
import { formString } from "@/lib/form-data";
import { isBotSubmission, openPublicSubmission } from "@/lib/public-submission";
import { eventReportSchema } from "@/features/reports/schemas";

const UNAVAILABLE = "현재 제보 접수를 준비 중입니다. 잠시 후 다시 이용해 주세요.";

/** 방문자 행사 제보. 검증 → 요청 제한 → 저장 순서로 처리한다. */
export async function submitEventReportAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (isBotSubmission(formData)) return actionSucceeded();

  const parsed = eventReportSchema.safeParse({
    title: formString(formData, "title"),
    body: formString(formData, "body"),
    sourceUrl: formString(formData, "sourceUrl"),
  });
  if (!parsed.success) return invalidFormInput(parsed.error);

  const submission = await openPublicSubmission("event_report", UNAVAILABLE);
  if ("error" in submission) return actionFailed(submission.error);

  const { error } = await submission.client.from("event_reports").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    source_url: parsed.data.sourceUrl,
  });
  if (error) {
    console.error("Event report insert failed", error.message);
    return actionFailed("제보를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  return actionSucceeded();
}
