import type { SubmissionReviewCardData } from "@/components/admin/submission-review-card";
import { parseSubmissionReviewStatus } from "@/components/admin/submission-review-status";
import type { Tables } from "@/lib/supabase/database.types";

/** getAdminSiteFeedback의 반환 모양: select한 컬럼 + 서명 URL(image_url) */
type SiteFeedbackRow = Pick<Tables<"site_feedback">, "id" | "title" | "body" | "link_url" | "review_status" | "created_at"> & {
  image_url: string | null;
};

export function toSiteFeedbackCardData(row: SiteFeedbackRow): SubmissionReviewCardData {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    imageUrl: row.image_url,
    reviewStatus: parseSubmissionReviewStatus(row.review_status),
    createdAt: row.created_at,
  };
}
