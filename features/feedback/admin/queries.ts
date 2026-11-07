import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { FEEDBACK_IMAGE_BUCKET } from "@/features/feedback/schemas";

const IMAGE_URL_TTL_SECONDS = 60 * 60;

/** 의견 목록. 첨부 사진은 비공개 bucket이라 1시간짜리 서명 URL을 만들어 붙인다. */
export async function getAdminSiteFeedback() {
  const client = await createSessionSupabaseClient();
  const { data, error } = await client
    .from("site_feedback")
    .select("id, title, body, link_url, image_path, review_status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`의견 목록을 불러오지 못했습니다: ${error.message}`);

  const rows = data ?? [];
  const imagePaths = rows.flatMap((feedback) => (feedback.image_path ? [feedback.image_path] : []));
  if (imagePaths.length === 0) return rows.map((feedback) => ({ ...feedback, image_url: null }));

  // 사진마다 따로 부르지 않고 한 번에 서명 URL을 만든다(의견 수만큼 Storage를 호출하던 N+1 제거).
  const { data: signed, error: imageError } = await client.storage
    .from(FEEDBACK_IMAGE_BUCKET)
    .createSignedUrls(imagePaths, IMAGE_URL_TTL_SECONDS);
  if (imageError) console.error("Site feedback image URL creation failed", imageError.message);
  const urlByPath = new Map((signed ?? []).flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [])));

  return rows.map((feedback) => ({
    ...feedback,
    image_url: feedback.image_path ? urlByPath.get(feedback.image_path) ?? null : null,
  }));
}
