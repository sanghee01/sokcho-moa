"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import {
  adminActionFailed as actionFailed,
  invalidInput,
  throwActionError,
  type AdminActionState,
} from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { formString } from "@/lib/form-data";
import { notifyIndexNow } from "@/lib/seo/indexnow";
import { createSessionSupabaseClient, type SessionSupabaseClient } from "@/lib/supabase/server";
import {
  EXCLUDED_EVENT_MESSAGE,
  findExclusionFailure,
  isEventCollectionExcludedError,
} from "@/features/events/admin/collection-exclusion";
import { buildEventPayload, eventSavedRedirect } from "@/features/events/admin/event-payload";
import { readEventFormInput } from "@/features/events/admin/form-input";
import { readEventImageFile, removeEventImage, uploadEventImage } from "@/features/events/admin/image-storage";
import { eventFormSchema } from "@/features/events/admin/schemas";
import { eventIndexNowPaths, expirePublicEvents } from "@/features/events/cache";

const reviewSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  status: z.enum(["pending", "published", "rejected"]),
});

const eventDeleteSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.literal("delete"),
});

const eventCollectionExclusionSchema = z.object({
  id: z.string().uuid(),
});

const SAVE_FAILED_MESSAGE = "행사를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

async function readPublication(client: SessionSupabaseClient, id: string) {
  const { data, error } = await client
    .from("events")
    .select("category, review_status")
    .eq("id", id)
    .maybeSingle();
  return { publication: data as { category: string; review_status: string } | null, error };
}

/** 공개 중이었거나 공개된 행사만 검색엔진에 알린다. 응답을 늦추지 않도록 응답 뒤(after)에 보낸다. */
function notifySearchEnginesAfterResponse(slug: string, categories: readonly unknown[]) {
  after(() => notifyIndexNow(eventIndexNowPaths(slug, categories)));
}

/**
 * 행사 작성·수정. 행사·회차·출처를 RPC 하나로 저장해, 중간에 실패해도 일부만 저장되지 않는다.
 * 순서: 인가 → 검증 → 재수집 제외 확인 → 이미지 업로드 → 저장 → 캐시 만료 → 검색엔진 알림
 */
export async function saveEventAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const { uploadedImageUrl, values } = readEventFormInput(formData);
  const parsed = eventFormSchema.safeParse(values);
  if (!parsed.success) return invalidInput(parsed.error);

  // 폼에서 미리 올린 이미지가 있으면 그것을 쓰고, 없으면 이번 저장에서 함께 올린다.
  const selectedImage = uploadedImageUrl ? { file: null, error: null } : readEventImageFile(formData);
  if (selectedImage.error) return actionFailed(selectedImage.error);

  const event = parsed.data;
  const isEditing = Boolean(event.id);
  const verifiedAt = new Date().toISOString();
  const payload = buildEventPayload(event, verifiedAt);
  const client = await createSessionSupabaseClient();

  let previous: { category: string; review_status: string } | null = null;
  if (event.id) {
    const { publication, error } = await readPublication(client, event.id);
    if (error) {
      console.error("Event publication read failed", error.message);
      return actionFailed("수정 전 행사의 공개 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    previous = publication;
  }

  const exclusionFailure = await findExclusionFailure(client, { slug: event.slug, sourceUrl: payload.source_url });
  if (exclusionFailure) return exclusionFailure;

  // 이번 저장에서 올린 이미지만 실패 시 지운다. 폼에서 미리 올린 이미지는 다시 시도할 수 있게 남긴다.
  let newImagePath: string | null = null;
  if (selectedImage.file) {
    const upload = await uploadEventImage(client, selectedImage.file);
    if (upload.error || !upload.image) return actionFailed(upload.error ?? "이미지를 업로드하지 못했습니다.");
    payload.image_url = upload.image.publicUrl;
    newImagePath = upload.image.path;
  }

  const occurrences = event.scheduleMode === "occurrences"
    ? event.occurrences.map((occurrence) => ({ starts_at: occurrence.startsAt, ends_at: occurrence.endsAt }))
    : [];

  const { data: savedEventId, error } = event.id
    ? await client.rpc("update_event_with_source", {
      p_event_id: event.id,
      p_event: payload,
      p_occurrences: occurrences,
      p_source_checked_at: verifiedAt,
    })
    : await client.rpc("create_event_with_source", {
      p_event: payload,
      p_occurrences: occurrences,
      p_source_checked_at: verifiedAt,
    });
  if (error || typeof savedEventId !== "string") {
    await removeEventImage(client, newImagePath);
    if (error) console.error("Event save failed", error.message);
    return actionFailed(error && isEventCollectionExcludedError(error.message) ? EXCLUDED_EVENT_MESSAGE : SAVE_FAILED_MESSAGE);
  }

  const { publication: saved, error: savedError } = await readPublication(client, savedEventId);
  if (savedError) console.warn("저장한 행사의 공개 상태를 확인하지 못했습니다.", savedError.message);

  expirePublicEvents(event.slug);
  const wasPublished = previous?.review_status === "published";
  const isPublished = saved?.review_status === "published";
  if (wasPublished || isPublished) {
    notifySearchEnginesAfterResponse(event.slug, [
      ...(wasPublished ? [previous?.category, event.category] : []),
      ...(isPublished ? [saved?.category ?? event.category] : []),
    ]);
  }
  redirect(eventSavedRedirect(isEditing));
}

/** 검수 목록의 공개·반려·대기 버튼. 공개할 때마다 published_at을 지금 시각으로 다시 쓴다(기존 동작). */
export async function setEventReviewStatusAction(input: unknown) {
  await requireAdmin();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) throwActionError("변경할 공개 상태를 확인해 주세요.");

  const client = await createSessionSupabaseClient();

  const { data: updatedEvent, error } = await client
    .from("events")
    .update({
      review_status: parsed.data.status,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id)
    .select("category")
    .single();
  if (error) throwActionError("공개 상태를 바꾸지 못했습니다.", error);

  expirePublicEvents(parsed.data.slug);
  notifySearchEnginesAfterResponse(parsed.data.slug, [updatedEvent?.category]);
  return { status: parsed.data.status };
}

/** 행사 삭제. DB가 직접 delete를 막아 두어 RPC로만 지울 수 있고, RPC가 재수집 제외 기록을 남긴다. */
export async function deleteEventAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = eventDeleteSchema.safeParse({
    id: formString(formData, "id"),
    confirmation: formString(formData, "confirmation"),
  });
  if (!parsed.success) return actionFailed("삭제 요청을 확인한 뒤 다시 시도해 주세요.");

  const client = await createSessionSupabaseClient();
  const { publication, error: readError } = await readPublication(client, parsed.data.id);
  if (readError) {
    console.error("Event publication read failed", readError.message);
    return actionFailed("삭제할 행사의 공개 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const { data: deletedSlug, error } = await client.rpc("delete_event_and_exclude", {
    p_event_id: parsed.data.id,
    p_reason: "관리자 대시보드에서 삭제",
  });
  if (error) {
    console.error("Event delete failed", error.message);
    return actionFailed("행사를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const slug = typeof deletedSlug === "string" ? deletedSlug : null;
  expirePublicEvents(slug);
  if (slug && publication?.review_status === "published") {
    notifySearchEnginesAfterResponse(slug, [publication.category]);
  }
  redirect("/admin?tab=events&deleted=event");
}

export async function releaseEventCollectionExclusionAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = eventCollectionExclusionSchema.safeParse({ id: formString(formData, "id") });
  if (!parsed.success) return actionFailed("재수집 허용 대상을 확인해 주세요.");

  const client = await createSessionSupabaseClient();
  const { data: released, error } = await client.rpc("release_event_collection_exclusion", {
    p_tombstone_id: parsed.data.id,
  });
  if (error || released !== true) {
    if (error) console.error("Event exclusion release failed", error.message);
    return actionFailed("재수집 제외를 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath("/admin");
  redirect("/admin?tab=exclusions&released=event-exclusion");
}
