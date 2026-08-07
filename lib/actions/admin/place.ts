"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString } from "@/lib/actions/admin/form-data";
import type { AdminActionState } from "@/lib/actions/admin/types";
import { requireAdmin } from "@/lib/admin/auth";
import { placeFormSchema } from "@/lib/admin/schemas";
import { PUBLIC_PLACES_CACHE_TAG } from "@/lib/data/cache-tags";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

const deletePlaceSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  confirmation: z.literal("delete"),
});

function actionFailed(message: string): AdminActionState {
  return { error: message };
}

function invalidFields(error: z.ZodError): AdminActionState {
  const firstIssue = error.issues[0];
  return actionFailed(firstIssue?.message
    ? `입력값을 확인해 주세요. ${firstIssue.message}`
    : "입력값을 확인해 주세요.");
}

function revalidatePlacePaths() {
  updateTag(PUBLIC_PLACES_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin");
}

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
  if (!parsed.success) return invalidFields(parsed.error);

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
  const parsed = deletePlaceSchema.safeParse({
    id: formString(formData, "id"),
    slug: formString(formData, "slug"),
    confirmation: formString(formData, "confirmation"),
  });
  if (!parsed.success) return actionFailed("삭제 확인에 체크한 뒤 다시 시도해 주세요.");

  const client = await createAuthenticatedSupabaseClient();
  if (!client) return actionFailed("운영자 데이터 연결을 확인해 주세요.");
  const { error } = await client.from("places").delete().eq("id", parsed.data.id);
  if (error) return actionFailed("명소를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");

  revalidatePlacePaths();
  redirect("/admin?tab=places&deleted=place");
}
