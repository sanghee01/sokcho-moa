"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString } from "@/lib/actions/admin/form-data";
import { buildCandidateEventPayload } from "@/lib/actions/admin/import-payload";
import type { AdminActionState } from "@/lib/actions/admin/types";
import { requireAdmin } from "@/lib/admin/auth";
import { candidateJsonSchema } from "@/lib/admin/schemas";
import { extractSourceExternalId } from "@/lib/domain/source";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

type AuthenticatedSupabaseClient = NonNullable<Awaited<ReturnType<typeof createAuthenticatedSupabaseClient>>>;

function actionFailed(message: string): AdminActionState {
  return { error: message };
}

function invalidFields(error: z.ZodError): AdminActionState {
  const firstIssue = error.issues[0];
  return actionFailed(firstIssue?.message
    ? `입력값을 확인해 주세요. ${firstIssue.message}`
    : "입력값을 확인해 주세요.");
}

function isEventCollectionExcludedError(message: string) {
  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes("event_collection_excluded")
    || normalizedMessage.includes("event collection excluded")
    || message.includes("재수집 제외");
}

async function checkEventCollectionExclusion(
  client: AuthenticatedSupabaseClient,
  input: { slug: string; sourceUrl: string },
): Promise<AdminActionState | null> {
  const { data, error } = await client.rpc("is_event_collection_excluded", {
    p_slug: input.slug,
    p_source_url: input.sourceUrl,
    p_external_id: extractSourceExternalId(input.sourceUrl),
  });
  if (error) {
    return actionFailed("재수집 제외 목록을 확인하지 못했습니다. 데이터베이스 업데이트 상태를 확인해 주세요.");
  }
  if (data === true) {
    return actionFailed("이 행사는 이전에 삭제되어 재수집 제외 중입니다. 관리자 대시보드에서 먼저 재수집을 허용해 주세요.");
  }
  return null;
}

export async function importEventCandidateAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = candidateJsonSchema.safeParse(formString(formData, "candidateJson"));
  if (!parsed.success) return invalidFields(parsed.error);

  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");

  const eventPayload = buildCandidateEventPayload(parsed.data, `candidate-${Date.now()}`);
  const exclusionFailure = await checkEventCollectionExclusion(client, {
    slug: eventPayload.slug,
    sourceUrl: eventPayload.source_url,
  });
  if (exclusionFailure) return exclusionFailure;

  const { data: eventId, error } = await client.rpc("create_event_with_source", {
    p_event: eventPayload,
    p_occurrences: [],
    p_source_checked_at: new Date().toISOString(),
  });
  if (error) {
    return actionFailed(isEventCollectionExcludedError(error.message)
      ? "이 후보 행사는 이전에 삭제되어 재수집 제외 중입니다. 관리자 대시보드에서 먼저 재수집을 허용해 주세요."
      : error.message.includes("create_event_with_source")
        ? "후보 등록 기능을 사용하려면 먼저 데이터베이스 업데이트가 필요합니다."
        : "후보 행사를 등록하지 못했습니다. JSON 내용을 확인해 주세요.");
  }
  if (typeof eventId !== "string") return actionFailed("등록된 후보 행사를 확인하지 못했습니다.");

  revalidatePath("/admin");
  redirect(`/admin/events/${eventId}?created=1`);
}
