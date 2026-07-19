"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
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

function nullableNumberValue(formData: FormData, key: string) {
  const raw = value(formData, key).trim();
  return raw ? raw : null;
}

function fail(error: z.ZodError): never {
  throw new Error(`입력값을 확인하세요. ${z.prettifyError(error)}`);
}

export type AdminActionState = { error: string | null };

function invalidFields(error: z.ZodError): AdminActionState {
  const firstIssue = error.issues[0];
  return { error: firstIssue?.message ? `입력값을 확인해 주세요. ${firstIssue.message}` : "입력값을 확인해 주세요." };
}

function actionFailed(message: string): AdminActionState {
  return { error: message };
}

function revalidatePublicEventPaths(slug?: string | null) {
  updateTag(PUBLIC_EVENTS_CACHE_TAG);
  revalidatePath("/");
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

export async function saveEventAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = eventFormSchema.safeParse({
    id: value(formData, "id") || undefined,
    slug: value(formData, "slug"),
    title: value(formData, "title"),
    summary: value(formData, "summary"),
    description: value(formData, "description"),
    category: value(formData, "category"),
    audiences: formData.getAll("audiences").filter((item): item is string => typeof item === "string"),
    eventStartAt: value(formData, "eventStartAt"),
    eventEndAt: value(formData, "eventEndAt"),
    operatingHours: value(formData, "operatingHours"),
    applicationStartAt: value(formData, "applicationStartAt"),
    applicationEndAt: value(formData, "applicationEndAt"),
    locationName: value(formData, "locationName"),
    address: value(formData, "address"),
    latitude: nullableNumberValue(formData, "latitude"),
    longitude: nullableNumberValue(formData, "longitude"),
    locationSourceUrl: value(formData, "locationSourceUrl"),
    locationVerifiedAt: value(formData, "locationVerifiedAt"),
    priceText: value(formData, "priceText"),
    isFree: value(formData, "isFree") || "unknown",
    organizer: value(formData, "organizer"),
    contact: value(formData, "contact"),
    officialUrl: value(formData, "officialUrl"),
    applicationUrl: value(formData, "applicationUrl"),
    imageUrl: value(formData, "imageUrl"),
    sourceName: value(formData, "sourceName"),
    sourceUrl: value(formData, "sourceUrl"),
    isFeatured: formData.get("isFeatured") === "on",
    lastVerifiedAt: value(formData, "lastVerifiedAt"),
  });
  if (!parsed.success) return invalidFields(parsed.error);
  const event = parsed.data;
  const payload = {
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    description: event.description,
    category: event.category,
    audiences: event.audiences,
    event_start_at: event.eventStartAt,
    event_end_at: event.eventEndAt,
    operating_hours: event.operatingHours,
    application_start_at: event.applicationStartAt,
    application_end_at: event.applicationEndAt,
    location_name: event.locationName,
    address: event.address,
    latitude: event.latitude,
    longitude: event.longitude,
    location_source_url: event.locationSourceUrl,
    location_verified_at: event.locationVerifiedAt,
    price_text: event.priceText,
    is_free: event.isFree,
    organizer: event.organizer,
    contact: event.contact,
    official_url: event.officialUrl,
    application_url: event.applicationUrl,
    image_url: event.imageUrl,
    source_name: event.sourceName,
    source_url: event.sourceUrl,
    is_featured: event.isFeatured,
    last_verified_at: event.lastVerifiedAt,
  };
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const result = event.id
    ? await client.from("events").update(payload).eq("id", event.id).select("id").single()
    : await client.from("events").insert({ ...payload, review_status: "pending" }).select("id").single();
  if (result.error) return actionFailed("행사를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  const sourcePayload = {
    event_id: result.data.id,
    provider: event.sourceName,
    original_url: event.sourceUrl,
    external_id: extractSourceExternalId(event.sourceUrl),
    last_checked_at: event.lastVerifiedAt,
  };
  const sourceResult = await client
    .from("event_sources")
    .upsert(sourcePayload, { onConflict: "event_id,provider,original_url" });
  const sourceError = sourceResult.error;
  if (sourceError) return actionFailed("행사 출처를 저장하지 못했습니다. 입력한 출처를 확인해 주세요.");
  revalidateEventPaths(event.slug);
  redirect(`/admin/events/${result.data.id}?saved=1`);
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

export async function uploadEventImageAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), slug: z.string().min(1) }).safeParse({ id: value(formData, "id"), slug: value(formData, "slug") });
  if (!parsed.success) return invalidFields(parsed.error);
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return actionFailed("업로드할 이미지를 선택하세요.");
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) return actionFailed("JPG, PNG, WebP 이미지만 업로드할 수 있습니다.");
  if (file.size > 5 * 1024 * 1024) return actionFailed("이미지는 5MB 이하여야 합니다.");
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const path = `events/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage.from("event-images").upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) return actionFailed("이미지를 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  const { data } = client.storage.from("event-images").getPublicUrl(path);
  const { error: updateError } = await client.from("events").update({ image_url: data.publicUrl }).eq("id", parsed.data.id);
  if (updateError) return actionFailed("업로드한 이미지 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  revalidateEventPaths(parsed.data.slug);
  redirect(`/admin/events/${parsed.data.id}?uploaded=1`);
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
