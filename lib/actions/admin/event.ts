"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import {
  readEventImageFile,
  removeEventImage,
  uploadEventImage,
} from "@/lib/actions/admin/event-image-storage";
import { formString } from "@/lib/actions/admin/form-data";
import type { AdminActionState } from "@/lib/actions/admin/types";
import { requireAdmin } from "@/lib/admin/auth";
import { combineDateAndOptionalTime } from "@/lib/admin/datetime";
import { buildEventPayload, createEventSlug, eventSavedRedirect } from "@/lib/admin/event-write";
import { eventFormSchema } from "@/lib/admin/schemas";
import { PUBLIC_EVENTS_CACHE_TAG } from "@/lib/data/cache-tags";
import { extractSourceExternalId } from "@/lib/domain/source";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

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

type AuthenticatedSupabaseClient = NonNullable<Awaited<ReturnType<typeof createAuthenticatedSupabaseClient>>>;

function dateTimeValue(formData: FormData, key: string) {
  return combineDateAndOptionalTime(formString(formData, key), formString(formData, `${key}Time`));
}

function occurrenceValues(formData: FormData) {
  const strings = (key: string) => formData.getAll(key).map((item) => typeof item === "string" ? item : "");
  const starts = strings("occurrenceStartsAt");
  const startTimes = strings("occurrenceStartsAtTime");
  const ends = strings("occurrenceEndsAt");
  const endTimes = strings("occurrenceEndsAtTime");

  return starts
    .map((startsAt, index) => ({
      startsAt: combineDateAndOptionalTime(startsAt, startTimes[index] ?? ""),
      endsAt: combineDateAndOptionalTime(ends[index] ?? "", endTimes[index] ?? ""),
    }))
    .filter((occurrence) => occurrence.startsAt.trim() || occurrence.endsAt.trim());
}

function listValues(formData: FormData, key: string) {
  return formString(formData, key)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function actionFailed(message: string): AdminActionState {
  return { error: message };
}

function invalidFields(error: z.ZodError): AdminActionState {
  const firstIssue = error.issues[0];
  return actionFailed(firstIssue?.message
    ? `입력값을 확인해 주세요. ${firstIssue.message}`
    : "입력값을 확인해 주세요.");
}

function fail(error: z.ZodError): never {
  throw new Error(`입력값을 확인하세요. ${z.prettifyError(error)}`);
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

function revalidatePublicEventPaths(slug?: string | null) {
  updateTag(PUBLIC_EVENTS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/events/${slug}`);
}

function revalidateEventPaths(slug?: string | null) {
  revalidatePublicEventPaths(slug);
  revalidatePath("/admin");
}

export async function saveEventAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const uploadedImageUrl = formString(formData, "uploadedImageUrl");
  const parsed = eventFormSchema.safeParse({
    id: formString(formData, "id") || undefined,
    slug: formString(formData, "slug") || createEventSlug(),
    title: formString(formData, "title"),
    introduction: formString(formData, "introduction"),
    category: formString(formData, "category"),
    audiences: formData.getAll("audiences").filter((item): item is string => typeof item === "string"),
    eventStartAt: dateTimeValue(formData, "eventStartAt"),
    eventEndAt: dateTimeValue(formData, "eventEndAt"),
    operatingHours: formString(formData, "operatingHours"),
    scheduleMode: formString(formData, "scheduleMode") || "continuous",
    occurrences: occurrenceValues(formData),
    applicationStartAt: dateTimeValue(formData, "applicationStartAt"),
    applicationEndAt: dateTimeValue(formData, "applicationEndAt"),
    locationName: formString(formData, "locationName"),
    address: formString(formData, "address"),
    priceText: formString(formData, "priceText"),
    isFree: formString(formData, "isFree") || "unknown",
    performerPeople: listValues(formData, "performerPeople"),
    performerGroups: listValues(formData, "performerGroups"),
    organizer: formString(formData, "organizer"),
    organizerUrl: formString(formData, "organizerUrl"),
    contact: formString(formData, "contact"),
    applicationUrl: formString(formData, "applicationUrl"),
    imageUrl: uploadedImageUrl || formString(formData, "imageUrl"),
    sourceName: formString(formData, "sourceName"),
    sourceUrl: formString(formData, "sourceUrl"),
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return invalidFields(parsed.error);

  const selectedImage = uploadedImageUrl ? { file: null, error: null } : readEventImageFile(formData);
  if (selectedImage.error) return actionFailed(selectedImage.error);

  const event = parsed.data;
  const isEditing = Boolean(event.id);
  const verifiedAt = new Date().toISOString();
  const payload = buildEventPayload(event, verifiedAt);
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");

  // A separately uploaded image remains owned by the form so the user can retry.
  // Only an image created inside this save attempt is safe to remove on failure.
  let newImagePath: string | null = null;
  const exclusionFailure = await checkEventCollectionExclusion(client, {
    slug: event.slug,
    sourceUrl: payload.source_url,
  });
  if (exclusionFailure) {
    await removeEventImage(client, newImagePath);
    return exclusionFailure;
  }

  if (selectedImage.file) {
    const upload = await uploadEventImage(client, selectedImage.file);
    if (upload.error || !upload.image) return actionFailed(upload.error ?? "이미지를 업로드하지 못했습니다.");
    payload.image_url = upload.image.publicUrl;
    newImagePath = upload.image.path;
  }

  const occurrences = event.scheduleMode === "occurrences"
    ? event.occurrences.map((occurrence) => ({ starts_at: occurrence.startsAt, ends_at: occurrence.endsAt }))
    : [];

  if (!event.id) {
    const { data: createdEventId, error } = await client.rpc("create_event_with_source", {
      p_event: payload,
      p_occurrences: occurrences,
      p_source_checked_at: verifiedAt,
    });
    if (error || typeof createdEventId !== "string") {
      await removeEventImage(client, newImagePath);
      const message = error?.message ?? "신규 행사 생성 결과를 확인하지 못했습니다.";
      return actionFailed(isEventCollectionExcludedError(message)
        ? "이 행사는 이전에 삭제되어 재수집 제외 중입니다. 관리자 대시보드에서 먼저 재수집을 허용해 주세요."
        : message.includes("create_event_with_source")
          ? "신규 행사 저장 기능을 사용하려면 먼저 데이터베이스 업데이트가 필요합니다."
          : "행사를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  } else {
    const { data: updatedEventId, error } = await client.rpc("update_event_with_source", {
      p_event_id: event.id,
      p_event: payload,
      p_occurrences: occurrences,
      p_source_checked_at: verifiedAt,
    });
    if (error || typeof updatedEventId !== "string") {
      await removeEventImage(client, newImagePath);
      const message = error?.message ?? "행사 수정 결과를 확인하지 못했습니다.";
      return actionFailed(isEventCollectionExcludedError(message)
        ? "이 행사는 이전에 삭제되어 재수집 제외 중입니다. 관리자 대시보드에서 먼저 재수집을 허용해 주세요."
        : message.includes("update_event_with_source")
          ? "행사 수정 기능을 사용하려면 먼저 데이터베이스 업데이트가 필요합니다."
          : "행사를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  revalidateEventPaths(event.slug);
  redirect(eventSavedRedirect(isEditing));
}

export async function setEventReviewStatusAction(input: unknown) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) fail(parsed.error);

  await requireAdmin();
  const client = await createAuthenticatedSupabaseClient();
  if (!client) throw new Error("Supabase 관리자 연결이 없습니다.");

  const { error } = await client
    .from("events")
    .update({
      review_status: parsed.data.status,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id);
  if (error) throw new Error(`공개 상태를 바꾸지 못했습니다: ${error.message}`);

  after(() => revalidatePublicEventPaths(parsed.data.slug));
  return { status: parsed.data.status };
}

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

  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const { data: deletedSlug, error } = await client.rpc("delete_event_and_exclude", {
    p_event_id: parsed.data.id,
    p_reason: "관리자 대시보드에서 삭제",
  });
  if (error) {
    return actionFailed(error.message.includes("delete_event_and_exclude")
      ? "삭제 기능을 사용하려면 먼저 데이터베이스 업데이트가 필요합니다."
      : "행사를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidateEventPaths(typeof deletedSlug === "string" ? deletedSlug : null);
  redirect("/admin?deleted=event");
}

export async function releaseEventCollectionExclusionAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = eventCollectionExclusionSchema.safeParse({ id: formString(formData, "id") });
  if (!parsed.success) return actionFailed("재수집 허용 대상을 확인해 주세요.");

  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const { data: released, error } = await client.rpc("release_event_collection_exclusion", {
    p_tombstone_id: parsed.data.id,
  });
  if (error || released !== true) {
    return actionFailed("재수집 제외를 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath("/admin");
  redirect("/admin?released=event-exclusion");
}
