import type { SubmissionReviewCardData } from "@/components/admin/submission-review-card";
import { parseSubmissionReviewStatus } from "@/components/admin/submission-review-status";
import type { Tables } from "@/lib/supabase/database.types";

/** getAdminEventReports의 select 모양 */
type EventReportRow = Pick<Tables<"event_reports">, "id" | "title" | "body" | "source_url" | "review_status" | "created_at">;

export function toEventReportCardData(row: EventReportRow): SubmissionReviewCardData {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    linkUrl: row.source_url,
    imageUrl: null,
    reviewStatus: parseSubmissionReviewStatus(row.review_status),
    createdAt: row.created_at,
  };
}
