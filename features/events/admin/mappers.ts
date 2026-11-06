import type { EventReviewStatus } from "@/features/events/model/review-status";
import type { Tables } from "@/lib/supabase/database.types";

type OccurrenceRow = Pick<Tables<"event_occurrences">, "id" | "starts_at" | "ends_at">;

/**
 * 관리자 수정 화면이 받는 행(getAdminEvent의 select("*, event_occurrences(id, starts_at, ends_at)")).
 * 생성 타입을 그대로 써서, DB 컬럼 이름이 바뀌면 폼의 `text(row, "컬럼")`에서 typecheck가 잡는다.
 */
export type AdminEventRow = Tables<"events"> & { event_occurrences?: OccurrenceRow[] | null };

/** 관리자 행사 목록의 한 행 */
export interface AdminEventListItem {
  id: string;
  slug: string;
  title: string;
  sourceName: string;
  viewCount: number;
  reviewStatus: EventReviewStatus;
}

export function toAdminEventListItem(row: Tables<"events">): AdminEventListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    sourceName: row.source_name,
    viewCount: row.view_count,
    reviewStatus: row.review_status,
  };
}
