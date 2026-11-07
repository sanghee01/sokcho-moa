import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isAllowedEventImageType, validateEventImage } from "@/features/events/admin/image-rules";
import { EventImageOptimizationError, optimizeEventImage } from "@/features/events/admin/image-optimize";

const EVENT_IMAGE_BUCKET = "event-images";

export function readEventImageFile(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { file: null, error: null };

  const error = validateEventImage(file);
  return error ? { file: null, error } : { file, error: null };
}

export async function uploadEventImage(client: SupabaseClient, file: File) {
  // 저장은 늘 WebP로 최적화하므로 원본 형식은 허용 여부만 본다.
  if (!isAllowedEventImageType(file.type)) {
    return { image: null, error: "지원하지 않는 파일 형식입니다." };
  }

  try {
    return await uploadEventImageBuffer(client, await optimizeEventImage(await file.arrayBuffer()));
  } catch (error) {
    return {
      image: null,
      error: error instanceof EventImageOptimizationError
        ? error.message
        : "이미지를 최적화해 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}

export async function uploadEventImageBuffer(client: SupabaseClient, image: ArrayBuffer | Uint8Array) {
  const path = `events/${crypto.randomUUID()}.webp`;
  const { error } = await client.storage
    .from(EVENT_IMAGE_BUCKET)
    .upload(path, image, {
      contentType: "image/webp",
      upsert: false,
    });
  if (error) return { image: null, error: "이미지를 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요." };

  const { data } = client.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(path);
  return { image: { path, publicUrl: data.publicUrl }, error: null };
}

export async function removeEventImage(client: SupabaseClient, path: string | null) {
  if (path?.startsWith("events/")) {
    const { error } = await client.storage.from(EVENT_IMAGE_BUCKET).remove([path]);
    if (error) console.error("Event image removal failed", path, error.message);
  }
}

const PUBLIC_URL_MARKER = `/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/`;

/** 우리 Storage의 행사 이미지 공개 URL이면 bucket 안 경로(events/...)를, 외부 이미지면 null을 돌려준다. */
export function eventImagePathFromPublicUrl(url: string | null) {
  if (!url) return null;
  const index = url.indexOf(PUBLIC_URL_MARKER);
  if (index < 0) return null;
  const path = decodeURIComponent(url.slice(index + PUBLIC_URL_MARKER.length).split(/[?#]/)[0]);
  return path.startsWith("events/") && !path.includes("..") ? path : null;
}

/**
 * 행사 이미지를 바꾸거나 지운 뒤(또는 행사를 삭제한 뒤) 이전 파일을 정리한다.
 * 공개 bucket이라 남겨 두면 삭제한 행사의 포스터도 예전 URL로 계속 공개된다.
 * 새 값과 같거나, 다른 행사가 아직 같은 URL을 쓰거나, 외부 이미지면 지우지 않는다.
 */
export async function cleanupUnusedEventImage(client: SupabaseClient, previousUrl: string | null, nextUrl: string | null) {
  if (!previousUrl || previousUrl === nextUrl) return;
  const path = eventImagePathFromPublicUrl(previousUrl);
  if (!path) return;

  const { count, error } = await client
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("image_url", previousUrl);
  if (error) {
    console.error("Event image reference check failed", error.message);
    return;
  }
  if (count === 0) await removeEventImage(client, path);
}
