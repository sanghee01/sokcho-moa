import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";

const IMAGE_URL_TTL_SECONDS = 60 * 60;

/** 의견 목록. 첨부 사진은 비공개 bucket이라 1시간짜리 서명 URL을 만들어 붙인다. */
export async function getAdminSiteFeedback() {
  const client = await createSessionSupabaseClient();
  const { data, error } = await client
    .from("site_feedback")
    .select("id, title, body, link_url, image_path, review_status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`의견 목록을 불러오지 못했습니다: ${error.message}`);

  return Promise.all((data ?? []).map(async (feedback) => {
    if (!feedback.image_path) return { ...feedback, image_url: null };
    const { data: image, error: imageError } = await client.storage
      .from("feedback-images")
      .createSignedUrl(feedback.image_path, IMAGE_URL_TTL_SECONDS);
    if (imageError) {
      console.error("Site feedback image URL creation failed", imageError.message);
      return { ...feedback, image_url: null };
    }
    return { ...feedback, image_url: image.signedUrl };
  }));
}
