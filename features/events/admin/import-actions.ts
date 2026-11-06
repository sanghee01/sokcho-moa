"use server";

import { adminResultHref } from "@/components/admin/admin-result";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminActionFailed, invalidInput, type AdminActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { formString } from "@/lib/form-data";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import {
  EXCLUDED_EVENT_MESSAGE,
  findExclusionFailure,
  isEventCollectionExcludedError,
} from "@/features/events/admin/collection-exclusion";
import { importOfficialEventImage } from "@/features/events/admin/image-import";
import { removeEventImage } from "@/features/events/admin/image-storage";
import { buildCandidateEventPayload } from "@/features/events/admin/import-payload";
import { candidateJsonSchema } from "@/features/events/admin/schemas";

/**
 * 수집기가 만든 후보 JSON(EventCandidate)을 검수 대기 행사로 등록한다.
 * 공식 포스터가 있으면 내려받아 최적화한 뒤 이미지 bucket에 올린다.
 */
export async function importEventCandidateAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = candidateJsonSchema.safeParse(formString(formData, "candidateJson"));
  if (!parsed.success) return invalidInput(parsed.error);

  const client = await createSessionSupabaseClient();

  const eventPayload = buildCandidateEventPayload(parsed.data, `candidate-${Date.now()}`);
  const exclusionFailure = await findExclusionFailure(client, {
    slug: eventPayload.slug,
    sourceUrl: eventPayload.source_url,
  });
  if (exclusionFailure) return exclusionFailure;

  let importedImagePath: string | null = null;
  if (parsed.data.imageUrl) {
    const imageImport = await importOfficialEventImage(client, parsed.data.imageUrl);
    if (imageImport.error || !imageImport.image) {
      return adminActionFailed(imageImport.error ?? "공식 포스터 이미지를 최적화해 저장하지 못했습니다.");
    }
    eventPayload.image_url = imageImport.image.publicUrl;
    importedImagePath = imageImport.image.path;
  }

  const { data: eventId, error } = await client.rpc("create_event_with_source", {
    p_event: eventPayload,
    p_occurrences: [],
    p_source_checked_at: new Date().toISOString(),
  });
  if (error || typeof eventId !== "string") {
    await removeEventImage(client, importedImagePath);
    if (error) console.error("Event candidate import failed", error.message);
    return adminActionFailed(error && isEventCollectionExcludedError(error.message)
      ? EXCLUDED_EVENT_MESSAGE
      : "후보 행사를 등록하지 못했습니다. JSON 내용을 확인해 주세요.");
  }

  revalidatePath("/admin");
  redirect(adminResultHref(`/admin/events/${eventId}`, "event-imported"));
}
