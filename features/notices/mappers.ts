import type { Tables } from "@/lib/supabase/database.types";
import { isNoticeKind, type Notice } from "@/features/notices/model/notice";

/** 공개한 공지 행 → Notice. 공개 시각이 없거나 모르는 종류면 null(DB 제약상 생기지 않지만 화면이 깨지지 않게 거른다). */
export function mapNoticeRow(row: Tables<"notices">): Notice | null {
  if (row.published_at === null || !isNoticeKind(row.kind)) return null;
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at,
  };
}
