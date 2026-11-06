"use server";

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
    officialUrl: formString(formData, "officialUrl"),
    mapUrl: formString(formData, "mapUrl"),
    isPublished: formData.get("isPublished") === "on",
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
    official_url: place.officialUrl,
    map_url: place.mapUrl,
    is_published: place.isPublished,
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
  redirect(`/admin/places/${result.data.id}?saved=1`);
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
  if (!parsed.success) return adminActionFailed("삭제 확인에 체크한 뒤 다시 시도해 주세요.");

  const client = await createSessionSupabaseClient();
  const { error } = await client.from("places").delete().eq("id", parsed.data.id);
  if (error) {
    console.error("Place delete failed", error.message);
    return adminActionFailed("명소를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  expirePublicPlaces();
  redirect("/admin?tab=places&deleted=place");
}
