import "server-only";
import { createSessionSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import { eventReviewStatuses, isEventReviewStatus, type EventReviewStatus } from "@/features/events/model/review-status";

export interface AdminEventDeletionIdentity {
  kind: string;
  identityValue: string;
  sourceUrl: string | null;
}

export interface AdminEventCollectionExclusion {
  id: string;
  originalTitle: string | null;
  originalSlug: string | null;
  deletedAt: string;
  deletedBy: string | null;
  reason: string | null;
  identities: AdminEventDeletionIdentity[];
}

export const ADMIN_EVENT_PAGE_SIZE = 20;
// 목록 표가 그리는 컬럼만 가져온다. 소개문처럼 긴 컬럼까지 20행씩 받을 이유가 없다(2026-11-07).
// 바꾸면 features/events/admin/mappers.ts의 AdminEventListRow도 함께 바꾼다(typecheck가 잡는다).
const ADMIN_EVENT_LIST_COLUMNS = "id, slug, title, source_name, view_count, review_status";

export async function getAdminEvents({
  status,
  page = 1,
  pageSize = ADMIN_EVENT_PAGE_SIZE,
}: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const client = await createSessionSupabaseClient();
  // 상태 변경은 updated_at을 갱신하므로 그 값으로 정렬하면 저장 직후 행이
  // 목록 맨 위로 이동한다. 생성 순서와 id를 사용해 상태 변경 전후 순서를 고정한다.
  let query = client
    .from("events")
    .select(ADMIN_EVENT_LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });
  if (isEventReviewStatus(status)) query = query.eq("review_status", status);
  const start = Math.max(0, (page - 1) * pageSize);
  query = query.range(start, start + pageSize - 1);
  const { data, count, error } = await query;
  // 요청한 페이지가 전체 행 수를 넘으면 PostgREST는 416(PGRST103)을 돌려준다. 오류가 아니라 "빈 페이지"로 보고,
  // 화면이 마지막 페이지로 다시 조회할 수 있게 전체 수만 따로 센다.
  if (error?.code === "PGRST103") {
    let countQuery = client.from("events").select("id", { count: "exact", head: true });
    if (isEventReviewStatus(status)) countQuery = countQuery.eq("review_status", status);
    const { count: totalCount, error: countError } = await countQuery;
    if (countError) throw new Error(`관리자 행사 수를 불러오지 못했습니다: ${countError.message}`);
    return { events: [], totalCount: totalCount ?? 0 };
  }
  if (error) throw new Error(`관리자 행사 목록을 불러오지 못했습니다: ${error.message}`);
  return { events: data ?? [], totalCount: count ?? 0 };
}

export async function getAdminEventStatusCounts(): Promise<Record<EventReviewStatus, number>> {
  const client = await createSessionSupabaseClient();

  const results = await Promise.all(
    eventReviewStatuses.map(async (status) => {
      const { count, error } = await client
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("review_status", status);
      if (error) throw new Error(`관리자 행사 상태별 수를 불러오지 못했습니다: ${error.message}`);
      return [status, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(results) as Record<EventReviewStatus, number>;
}

export async function getAdminEvent(id: string) {
  if (!isUuid(id)) return null;
  const client = await createSessionSupabaseClient();
  const { data, error } = await client
    .from("events")
    .select("*, event_occurrences(id, starts_at, ends_at)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`행사를 불러오지 못했습니다: ${error.message}`);
  return data;
}

export async function getAdminEventCollectionExclusions(): Promise<AdminEventCollectionExclusion[]> {
  const client = await createSessionSupabaseClient();
  const { data, error } = await client
    .from("event_deletion_tombstones")
    .select(`
      id,
      original_title,
      original_slug,
      deleted_at,
      deleted_by,
      reason,
      event_deletion_identities(kind, identity_value, source_url)
    `)
    .is("released_at", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(`재수집 제외 목록을 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map((row) => ({
    // 생성 타입을 그대로 옮긴다. 제목·slug가 빈 문자열이 되지 않게 DB check 제약이 막는다.
    id: row.id,
    originalTitle: row.original_title,
    originalSlug: row.original_slug,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
    reason: row.reason,
    identities: (row.event_deletion_identities ?? []).map((identity) => ({
      kind: identity.kind,
      identityValue: identity.identity_value,
      sourceUrl: identity.source_url,
    })),
  }));
}
