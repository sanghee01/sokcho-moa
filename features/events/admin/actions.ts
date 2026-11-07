"use server";

import { adminResultHref } from "@/components/admin/admin-result";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import {
  adminActionFailed,
  invalidInput,
  buttonActionFailed,
  type AdminActionState,
} from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { formString } from "@/lib/form-data";
import { notifyIndexNow } from "@/lib/seo/indexnow";
import type { Tables } from "@/lib/supabase/database.types";
import { createSessionSupabaseClient, type SessionSupabaseClient } from "@/lib/supabase/server";
import {
  EXCLUDED_EVENT_MESSAGE,
  findExclusionFailure,
  isEventCollectionExcludedError,
} from "@/features/events/admin/collection-exclusion";
import { buildEventPayload, eventSavedRedirect } from "@/features/events/admin/event-payload";
import { readEventFormInput } from "@/features/events/admin/form-input";
import { cleanupUnusedEventImage, readEventImageFile, removeEventImage, uploadEventImage } from "@/features/events/admin/image/storage";
import { eventFormSchema } from "@/features/events/admin/schemas";
import { eventIndexNowPaths, expirePublicEvents } from "@/features/events/cache";
import { eventReviewStatuses } from "@/features/events/model/review-status";
import type { EventCategory } from "@/features/events/model/taxonomy";

const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(eventReviewStatuses),
});

const eventDeleteSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.literal("delete"),
});

const eventCollectionExclusionSchema = z.object({
  id: z.string().uuid(),
});

const SAVE_FAILED_MESSAGE = "행사를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/** 공개 상태 판단과 이미지 정리에 필요한 행사 필드. 생성 타입을 그대로 써서 분류·검수 상태가 union으로 남는다. */
type EventPublication = Pick<Tables<"events">, "category" | "review_status" | "image_url">;

async function readPublication(client: SessionSupabaseClient, id: string) {
  const { data, error } = await client
    .from("events")
    .select("category, review_status, image_url")
    .eq("id", id)
    .maybeSingle();
  return { publication: data, error };
}

/** 공개 중이었거나 공개된 행사만 검색엔진에 알린다. 응답을 늦추지 않도록 응답 뒤(after)에 보낸다. */
function notifySearchEnginesAfterResponse(slug: string, categories: readonly (EventCategory | undefined)[]) {
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
  if (selectedImage.error) return adminActionFailed(selectedImage.error);

  const event = parsed.data;
  const isEditing = Boolean(event.id);
  const verifiedAt = new Date().toISOString();
  const payload = buildEventPayload(event, verifiedAt);
  const client = await createSessionSupabaseClient();

  let previous: EventPublication | null = null;
  if (event.id) {
    const { publication, error } = await readPublication(client, event.id);
    if (error) {
      console.error("Event publication read failed", error.message);
      return adminActionFailed("수정 전 행사의 공개 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    previous = publication;
  }

  const exclusionFailure = await findExclusionFailure(client, { slug: event.slug, sourceUrl: payload.source_url });
  if (exclusionFailure) return exclusionFailure;

  // 이번 저장에서 올린 이미지만 실패 시 지운다. 폼에서 미리 올린 이미지는 다시 시도할 수 있게 남긴다.
  let newImagePath: string | null = null;
  if (selectedImage.file) {
    const upload = await uploadEventImage(client, selectedImage.file);
    if (upload.error || !upload.image) return adminActionFailed(upload.error ?? "이미지를 업로드하지 못했습니다.");
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
    return adminActionFailed(error && isEventCollectionExcludedError(error.message) ? EXCLUDED_EVENT_MESSAGE : SAVE_FAILED_MESSAGE);
  }

  const { publication: saved, error: savedError } = await readPublication(client, savedEventId);
  if (savedError) console.warn("저장한 행사의 공개 상태를 확인하지 못했습니다.", savedError.message);
  // 수정으로 대표 이미지를 바꾸거나 지웠으면 이전 파일을 정리한다.
  if (previous && saved) await cleanupUnusedEventImage(client, previous.image_url, saved.image_url);

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

/**
 * 검수 목록의 공개·반려·대기 버튼.
 * - published_at은 처음 공개한 시각이다. 잠시 비공개했다가 다시 공개해도 바꾸지 않아 "새로 올라온 순"(예전 이름 게시순)과 "새로 올라옴" 표시가 흔들리지 않는다.
 * - 캐시 경로와 검색엔진 알림은 화면이 보낸 값이 아니라 DB의 slug·이전 상태로 정한다.
 */
export async function setEventReviewStatusAction(input: unknown) {
  await requireAdmin();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return buttonActionFailed("변경할 공개 상태를 확인해 주세요.");

  const client = await createSessionSupabaseClient();

  const { data: current, error: readError } = await client
    .from("events")
    .select("slug, category, review_status, published_at, event_start_at, event_end_at")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readError) return buttonActionFailed("행사의 현재 공개 상태를 확인하지 못했습니다.", readError);
  if (!current) return buttonActionFailed("이미 삭제되었거나 권한이 없는 행사입니다. 목록을 새로고침해 주세요.");
  // DB 제약(events_published_fields)과 같은 조건. 그대로 보내면 이유 없이 "바꾸지 못했습니다"만 보인다.
  if (parsed.data.status === "published" && !current.event_start_at) {
    return buttonActionFailed("행사 시작 일시가 있어야 공개할 수 있습니다. 행사를 수정해 시작 일시를 입력해 주세요.");
  }
  // 이 버튼은 폼 검증을 거치지 않는다. 수집 후보는 종료 없이 들어올 수 있어 여기서도 막는다(2026-11-07 사용자 결정).
  if (parsed.data.status === "published" && !current.event_end_at) {
    return buttonActionFailed("행사 종료 일시가 있어야 공개할 수 있습니다. 행사를 수정해 종료 날짜를 입력해 주세요.");
  }

  const { data: updatedEvent, error } = await client
    .from("events")
    .update({
      review_status: parsed.data.status,
      published_at: parsed.data.status === "published"
        ? current.published_at ?? new Date().toISOString()
        : current.published_at,
    })
    .eq("id", parsed.data.id)
    .select("slug, category")
    .single();
  if (error) return buttonActionFailed("공개 상태를 바꾸지 못했습니다.", error);

  expirePublicEvents(updatedEvent.slug);
  // 공개 페이지가 새로 생기거나 사라질 때만 검색엔진에 알린다(대기↔반려는 공개 URL에 변화가 없다).
  if (current.review_status === "published" || parsed.data.status === "published") {
    notifySearchEnginesAfterResponse(updatedEvent.slug, [updatedEvent.category]);
  }
  return { error: null, status: parsed.data.status };
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
  if (!parsed.success) return adminActionFailed("삭제 요청을 확인한 뒤 다시 시도해 주세요.");

  const client = await createSessionSupabaseClient();
  const { publication, error: readError } = await readPublication(client, parsed.data.id);
  if (readError) {
    console.error("Event publication read failed", readError.message);
    return adminActionFailed("삭제할 행사의 공개 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const { data: deletedSlug, error } = await client.rpc("delete_event_and_exclude", {
    p_event_id: parsed.data.id,
    p_reason: "관리자 대시보드에서 삭제",
  });
  if (error) {
    console.error("Event delete failed", error.message);
    return adminActionFailed("행사를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const slug = typeof deletedSlug === "string" ? deletedSlug : null;
  // 삭제한 행사의 포스터가 공개 bucket에 남아 예전 URL로 계속 보이지 않게 지운다.
  await cleanupUnusedEventImage(client, publication?.image_url ?? null, null);
  expirePublicEvents(slug);
  if (slug && publication?.review_status === "published") {
    notifySearchEnginesAfterResponse(slug, [publication.category]);
  }
  redirect(adminResultHref("/admin?tab=events", "event-deleted"));
}

export async function releaseEventCollectionExclusionAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = eventCollectionExclusionSchema.safeParse({ id: formString(formData, "id") });
  if (!parsed.success) return adminActionFailed("재수집 허용 대상을 확인해 주세요.");

  const client = await createSessionSupabaseClient();
  const { data: released, error } = await client.rpc("release_event_collection_exclusion", {
    p_tombstone_id: parsed.data.id,
  });
  if (error || released !== true) {
    if (error) console.error("Event exclusion release failed", error.message);
    return adminActionFailed("재수집 제외를 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath("/admin");
  redirect(adminResultHref("/admin?tab=exclusions", "exclusion-released"));
}
