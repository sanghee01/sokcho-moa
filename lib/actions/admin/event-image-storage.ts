import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { validateEventImage } from "@/lib/admin/event-image";

const EVENT_IMAGE_BUCKET = "event-images";

const eventImageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export function readEventImageFile(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { file: null, error: null };

  const error = validateEventImage(file);
  return error ? { file: null, error } : { file, error: null };
}

export async function uploadEventImage(client: SupabaseClient, file: File) {
  const extension = eventImageExtensions[file.type as keyof typeof eventImageExtensions];
  if (!extension) return { image: null, error: "지원하지 않는 파일 형식입니다." };

  const path = `events/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from(EVENT_IMAGE_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (error) return { image: null, error: "이미지를 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요." };

  const { data } = client.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(path);
  return { image: { path, publicUrl: data.publicUrl }, error: null };
}

export async function removeEventImage(client: SupabaseClient, path: string | null) {
  if (path?.startsWith("events/")) {
    await client.storage.from(EVENT_IMAGE_BUCKET).remove([path]);
  }
}
