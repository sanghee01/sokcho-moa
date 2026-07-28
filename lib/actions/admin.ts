"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { combineDateAndOptionalTime } from "@/lib/admin/datetime";
import { validateEventImage } from "@/lib/admin/event-image";
import { buildEventPayload, buildEventSourcePayload, createEventSlug, eventSavedRedirect } from "@/lib/admin/event-write";
import { candidateJsonSchema, eventFormSchema, placeFormSchema } from "@/lib/admin/schemas";
import { PUBLIC_EVENTS_CACHE_TAG, PUBLIC_PLACES_CACHE_TAG } from "@/lib/data/cache-tags";
import { extractSourceExternalId } from "@/lib/domain/source";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

const reviewSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  status: z.enum(["pending", "published", "rejected"]),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  confirmation: z.literal("delete"),
});

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function dateTimeValue(formData: FormData, key: string) {
  return combineDateAndOptionalTime(value(formData, key), value(formData, `${key}Time`));
}

function occurrenceValues(formData: FormData) {
  const starts = formData.getAll("occurrenceStartsAt").map((item) => typeof item === "string" ? item : "");
  const startTimes = formData.getAll("occurrenceStartsAtTime").map((item) => typeof item === "string" ? item : "");
  const ends = formData.getAll("occurrenceEndsAt").map((item) => typeof item === "string" ? item : "");
  const endTimes = formData.getAll("occurrenceEndsAtTime").map((item) => typeof item === "string" ? item : "");
  return starts
    .map((startsAt, index) => ({
      startsAt: combineDateAndOptionalTime(startsAt, startTimes[index] ?? ""),
      endsAt: combineDateAndOptionalTime(ends[index] ?? "", endTimes[index] ?? ""),
    }))
    .filter((occurrence) => occurrence.startsAt.trim() || occurrence.endsAt.trim());
}

function listValues(formData: FormData, key: string) {
  return value(formData, key)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fail(error: z.ZodError): never {
  throw new Error(`입력값을 확인하세요. ${z.prettifyError(error)}`);
}

export type AdminActionState = { error: string | null };
export type EventImageUploadState = {
  error: string | null;
  publicUrl: string | null;
  uploadedPath: string | null;
  selectionToken: string | null;
  fileName: string | null;
};

function invalidFields(error: z.ZodError): AdminActionState {
  const firstIssue = error.issues[0];
  return { error: firstIssue?.message ? `입력값을 확인해 주세요. ${firstIssue.message}` : "입력값을 확인해 주세요." };
}

function actionFailed(message: string): AdminActionState {
  return { error: message };
}

const eventImageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function eventImageFile(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { file: null, error: null };
  const error = validateEventImage(file);
  if (error) return { file: null, error };
  return { file, error: null };
}

function imageUploadFailed(
  previousState: EventImageUploadState,
  formData: FormData,
  message: string,
): EventImageUploadState {
  const file = formData.get("image");
  return {
    error: message,
    publicUrl: null,
    uploadedPath: previousState.uploadedPath,
    selectionToken: value(formData, "imageSelectionToken") || null,
    fileName: file instanceof File && file.size > 0 ? file.name : null,
  };
}

function isMissingScheduleSchema(message: string) {
  return message.includes("schedule_mode") || message.includes("replace_event_occurrences");
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

function revalidatePlacePaths() {
  updateTag(PUBLIC_PLACES_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function signInAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
  });
  if (!parsed.success) return { error: "이메일과 8자 이상의 비밀번호를 확인해 주세요." };
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return { error: "운영자 로그인이 아직 설정되지 않았습니다." };
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  redirect("/admin");
}

export async function signOutAction() {
  const client = await createAuthenticatedSupabaseClient();
  if (client) await client.auth.signOut();
  redirect("/admin/login");
}

export async function uploadEventImageAction(
  previousState: EventImageUploadState,
  formData: FormData,
): Promise<EventImageUploadState> {
  await requireAdmin();
  const image = eventImageFile(formData);
  if (image.error) return imageUploadFailed(previousState, formData, image.error);
  if (!image.file) return imageUploadFailed(previousState, formData, "업로드할 이미지를 선택하세요.");
  const selectionToken = value(formData, "imageSelectionToken");
  if (!selectionToken) return imageUploadFailed(previousState, formData, "이미지를 다시 선택해 주세요.");

  const client = await createAuthenticatedSupabaseClient();
  if (!client) return imageUploadFailed(previousState, formData, "운영자 데이터 연결을 확인해 주세요.");
  const extension = eventImageExtensions[image.file.type as keyof typeof eventImageExtensions];
  const path = `events/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage
    .from("event-images")
    .upload(path, await image.file.arrayBuffer(), { contentType: image.file.type, upsert: false });
  if (uploadError) return imageUploadFailed(previousState, formData, "이미지를 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.");

  const previousPath = value(formData, "previousUploadedImagePath");
  if (previousPath.startsWith("events/") && previousPath !== path) {
    await client.storage.from("event-images").remove([previousPath]);
  }
  const { data } = client.storage.from("event-images").getPublicUrl(path);
  return {
    error: null,
    publicUrl: data.publicUrl,
    uploadedPath: path,
    selectionToken,
    fileName: image.file.name,
  };
}

export async function saveEventAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const isEditing = Boolean(value(formData, "id"));
  const uploadedImageUrl = value(formData, "uploadedImageUrl");
  const parsed = eventFormSchema.safeParse({
    id: value(formData, "id") || undefined,
    slug: value(formData, "slug") || createEventSlug(),
    title: value(formData, "title"),
    summary: value(formData, "summary"),
    description: value(formData, "description"),
    category: value(formData, "category"),
    audiences: formData.getAll("audiences").filter((item): item is string => typeof item === "string"),
    eventStartAt: dateTimeValue(formData, "eventStartAt"),
    eventEndAt: dateTimeValue(formData, "eventEndAt"),
    operatingHours: value(formData, "operatingHours"),
    scheduleMode: value(formData, "scheduleMode") || "continuous",
    occurrences: occurrenceValues(formData),
    applicationStartAt: dateTimeValue(formData, "applicationStartAt"),
    applicationEndAt: dateTimeValue(formData, "applicationEndAt"),
    locationName: value(formData, "locationName"),
    address: value(formData, "address"),
    priceText: value(formData, "priceText"),
    isFree: value(formData, "isFree") || "unknown",
    performerPeople: listValues(formData, "performerPeople"),
    performerGroups: listValues(formData, "performerGroups"),
    organizer: value(formData, "organizer"),
    organizerUrl: value(formData, "organizerUrl"),
    contact: value(formData, "contact"),
    applicationUrl: value(formData, "applicationUrl"),
    imageUrl: uploadedImageUrl || value(formData, "imageUrl"),
    sourceName: value(formData, "sourceName"),
    sourceUrl: value(formData, "sourceUrl"),
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return invalidFields(parsed.error);
  const image = uploadedImageUrl ? { file: null, error: null } : eventImageFile(formData);
  if (image.error) return actionFailed(image.error);
  const event = parsed.data;
  const verifiedAt = new Date().toISOString();
  const payload = buildEventPayload(event, verifiedAt);
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  let uploadedImagePath: string | null = null;
  if (image.file) {
    const extension = eventImageExtensions[image.file.type as keyof typeof eventImageExtensions];
    const path = `events/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage
      .from("event-images")
      .upload(path, await image.file.arrayBuffer(), { contentType: image.file.type, upsert: false });
    if (uploadError) return actionFailed("이미지를 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    const { data } = client.storage.from("event-images").getPublicUrl(path);
    payload.image_url = data.publicUrl;
    uploadedImagePath = path;
  }
  let legacyScheduleSchema = false;
  let result = event.id
    ? await client.from("events").update(payload).eq("id", event.id).select("id").single()
    : await client.from("events").insert({ ...payload, review_status: "pending" }).select("id").single();
  if (result.error && isMissingScheduleSchema(result.error.message)) {
    if (event.scheduleMode === "occurrences") {
      return actionFailed("실제 운영 회차 기능을 사용하려면 먼저 데이터베이스 업데이트가 필요합니다.");
    }
    const legacyPayload: Partial<typeof payload> = { ...payload };
    delete legacyPayload.schedule_mode;
    result = event.id
      ? await client.from("events").update(legacyPayload).eq("id", event.id).select("id").single()
      : await client.from("events").insert({ ...legacyPayload, review_status: "pending" }).select("id").single();
    legacyScheduleSchema = true;
  }
  if (result.error) {
    if (uploadedImagePath) await client.storage.from("event-images").remove([uploadedImagePath]);
    return actionFailed("행사를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  if (!legacyScheduleSchema) {
    const occurrenceResult = await client.rpc("replace_event_occurrences", {
      p_event_id: result.data.id,
      p_occurrences: event.scheduleMode === "occurrences"
        ? event.occurrences.map((occurrence) => ({ starts_at: occurrence.startsAt, ends_at: occurrence.endsAt }))
        : [],
    });
    if (occurrenceResult.error) {
      return actionFailed(isMissingScheduleSchema(occurrenceResult.error.message)
        ? "실제 운영 회차 기능을 사용하려면 먼저 데이터베이스 업데이트가 필요합니다."
        : "행사 기본 정보는 저장했지만 운영 회차를 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  }
  const sourcePayload = buildEventSourcePayload(result.data.id, event, verifiedAt);
  const sourceResult = await client
    .from("event_sources")
    .upsert(sourcePayload, { onConflict: "event_id,provider,original_url" });
  const sourceError = sourceResult.error;
  if (sourceError) return actionFailed("행사 출처를 저장하지 못했습니다. 입력한 출처를 확인해 주세요.");
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
    .update({ review_status: parsed.data.status, published_at: parsed.data.status === "published" ? new Date().toISOString() : null })
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
  const parsed = deleteSchema.safeParse({
    id: value(formData, "id"),
    slug: value(formData, "slug"),
    confirmation: value(formData, "confirmation"),
  });
  if (!parsed.success) return actionFailed("삭제 확인에 체크한 뒤 다시 시도해 주세요.");
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const { error } = await client.from("events").delete().eq("id", parsed.data.id);
  if (error) return actionFailed("행사를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  revalidateEventPaths(parsed.data.slug);
  redirect("/admin?deleted=event");
}

export async function savePlaceAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = placeFormSchema.safeParse({
    id: value(formData, "id") || undefined,
    slug: value(formData, "slug"),
    name: value(formData, "name"),
    category: value(formData, "category"),
    summary: value(formData, "summary"),
    address: value(formData, "address"),
    latitude: value(formData, "latitude"),
    longitude: value(formData, "longitude"),
    imageUrl: value(formData, "imageUrl"),
    officialUrl: value(formData, "officialUrl"),
    mapUrl: value(formData, "mapUrl"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) return invalidFields(parsed.error);
  const place = parsed.data;
  const payload = {
    slug: place.slug, name: place.name, category: place.category, summary: place.summary, address: place.address,
    latitude: place.latitude, longitude: place.longitude, image_url: place.imageUrl, official_url: place.officialUrl,
    map_url: place.mapUrl, is_published: place.isPublished,
  };
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const result = place.id
    ? await client.from("places").update(payload).eq("id", place.id).select("id").single()
    : await client.from("places").insert(payload).select("id").single();
  if (result.error) return actionFailed("명소를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  revalidatePlacePaths();
  redirect(`/admin/places/${result.data.id}?saved=1`);
}

export async function deletePlaceAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = deleteSchema.safeParse({
    id: value(formData, "id"),
    slug: value(formData, "slug"),
    confirmation: value(formData, "confirmation"),
  });
  if (!parsed.success) return actionFailed("삭제 확인에 체크한 뒤 다시 시도해 주세요.");
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const { error } = await client.from("places").delete().eq("id", parsed.data.id);
  if (error) return actionFailed("명소를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  revalidatePlacePaths();
  redirect("/admin?deleted=place");
}

export async function importEventCandidateAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = candidateJsonSchema.safeParse(value(formData, "candidateJson"));
  if (!parsed.success) return invalidFields(parsed.error);
  const candidate = parsed.data;
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const slug = `candidate-${Date.now()}`;
  const { data, error } = await client.from("events").insert({
    slug,
    title: candidate.title,
    summary: candidate.summary,
    description: candidate.description,
    category: candidate.category ?? "other",
    audiences: candidate.audiences,
    event_start_at: candidate.eventStartAt,
    event_end_at: candidate.eventEndAt,
    operating_hours: candidate.operatingHours,
    application_start_at: candidate.applicationStartAt,
    application_end_at: candidate.applicationEndAt,
    location_name: candidate.locationName,
    address: candidate.address,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    price_text: candidate.priceText,
    is_free: candidate.isFree,
    organizer: candidate.organizer,
    contact: candidate.contact,
    official_url: candidate.officialUrl,
    application_url: candidate.applicationUrl,
    image_url: candidate.imageUrl,
    source_name: candidate.sourceName,
    source_url: candidate.sourceUrl,
    review_status: "pending",
    last_verified_at: null,
  }).select("id").single();
  if (error) return actionFailed("후보 행사를 등록하지 못했습니다. JSON 내용을 확인해 주세요.");
  const { error: sourceError } = await client.from("event_sources").insert({
    event_id: data.id,
    provider: candidate.sourceName,
    original_url: candidate.sourceUrl,
    external_id: extractSourceExternalId(candidate.sourceUrl),
    last_checked_at: new Date().toISOString(),
  });
  if (sourceError) return actionFailed("후보 출처를 등록하지 못했습니다. 공식 원문 URL을 확인해 주세요.");
  revalidatePath("/admin");
  redirect(`/admin/events/${data.id}?created=1`);
}
