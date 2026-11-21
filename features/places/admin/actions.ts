"use server";

import { adminResultHref } from "@/components/admin/admin-result";
import { redirect } from "next/navigation";
import { adminActionFailed, invalidInput, type AdminActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { formString } from "@/lib/form-data";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { expirePublicPlaces } from "@/features/places/cache";
import { placeDeleteSchema, placeFormSchema } from "@/features/places/admin/schemas";

export async function savePlaceAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = placeFormSchema.safeParse({
    id: formString(formData, "id") || undefined,
    slug: formString(formData, "slug"),
    name: formString(formData, "name"),
    category: formString(formData, "category"),
    summary: formString(formData, "summary"),
    address: formString(formData, "address"),
    latitude: formString(formData, "latitude"),
    longitude: formString(formData, "longitude"),
    imageUrl: formString(formData, "imageUrl"),
    imageCredit: formString(formData, "imageCredit"),
    imageSourceUrl: formString(formData, "imageSourceUrl"),
    imageAlt: formString(formData, "imageAlt"),
    officialUrl: formString(formData, "officialUrl"),
    mapUrl: formString(formData, "mapUrl"),
    isPublished: formData.get("isPublished") === "on",
    activityCategory: formString(formData, "activityCategory"),
    tags: formData.getAll("tags").filter((value) => typeof value === "string"),
    description: formString(formData, "description"),
    hoursSummary: formString(formData, "hoursSummary"),
    closedSummary: formString(formData, "closedSummary"),
    priceSummary: formString(formData, "priceSummary"),
    phone: formString(formData, "phone"),
    parkingSummary: formString(formData, "parkingSummary"),
    cautions: formString(formData, "cautions"),
    bookingUrl: formString(formData, "bookingUrl"),
    // 예전 폼(운영 상태 칸이 없던 화면)에서 온 제출은 정상 운영으로 본다.
    operationStatus: formString(formData, "operationStatus") || "open",
    statusNote: formString(formData, "statusNote"),
    verifiedOn: formString(formData, "verifiedOn"),
  });
  if (!parsed.success) return invalidInput(parsed.error);

  const place = parsed.data;
  const payload = {
    slug: place.slug,
    name: place.name,
    category: place.category,
    summary: place.summary,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    image_url: place.imageUrl,
    image_credit: place.imageCredit,
    image_source_url: place.imageSourceUrl,
    image_alt: place.imageAlt,
    official_url: place.officialUrl,
    map_url: place.mapUrl,
    is_published: place.isPublished,
    activity_category: place.activityCategory,
    tags: place.tags,
    description: place.description,
    hours_summary: place.hoursSummary,
    closed_summary: place.closedSummary,
    price_summary: place.priceSummary,
    phone: place.phone,
    parking_summary: place.parkingSummary,
    cautions: place.cautions,
    booking_url: place.bookingUrl,
    operation_status: place.operationStatus,
    status_note: place.statusNote,
    verified_on: place.verifiedOn,
  };
  const client = await createSessionSupabaseClient();

  const result = place.id
    ? await client.from("places").update(payload).eq("id", place.id).select("id").single()
    : await client.from("places").insert(payload).select("id").single();
  if (result.error) {
    console.error("Place save failed", result.error.message);
    return adminActionFailed("명소를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  expirePublicPlaces();
  redirect(adminResultHref(`/admin/places/${result.data.id}`, "place-saved"));
}

export async function deletePlaceAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = placeDeleteSchema.safeParse({
    id: formString(formData, "id"),
    confirmation: formString(formData, "confirmation"),
  });
  if (!parsed.success) return adminActionFailed("삭제 요청을 확인한 뒤 다시 시도해 주세요.");

  const client = await createSessionSupabaseClient();
  const { data: deleted, error } = await client.from("places").delete().eq("id", parsed.data.id).select("id");
  if (error) {
    console.error("Place delete failed", error.message);
    return adminActionFailed("명소를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  // RLS에 막히거나 이미 삭제된 행이면 오류 없이 0행이다.
  if (!deleted?.length) return adminActionFailed("이미 삭제되었거나 권한이 없는 항목입니다. 목록을 새로고침해 주세요.");

  expirePublicPlaces();
  redirect(adminResultHref("/admin?tab=places", "place-deleted"));
}
