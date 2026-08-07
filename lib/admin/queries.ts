import "server-only";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

export type AdminEventDeletionIdentity = {
  kind: string;
  identityValue: string;
  sourceUrl: string | null;
};

export type AdminEventCollectionExclusion = {
  id: string;
  originalTitle: string | null;
  originalSlug: string | null;
  deletedAt: string;
  deletedBy: string | null;
  reason: string | null;
  identities: AdminEventDeletionIdentity[];
};

export const ADMIN_EVENT_PAGE_SIZE = 20;

const eventReviewStatuses = ["pending", "published", "rejected"] as const;

type EventReviewStatus = (typeof eventReviewStatuses)[number];

function isEventReviewStatus(status?: string): status is EventReviewStatus {
  return Boolean(status && eventReviewStatuses.includes(status as EventReviewStatus));
}

export async function getAdminEvents({
  status,
  page = 1,
  pageSize = ADMIN_EVENT_PAGE_SIZE,
}: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return { events: [], totalCount: 0 };
  // 상태 변경은 updated_at을 갱신하므로 그 값으로 정렬하면 저장 직후 행이
  // 목록 맨 위로 이동한다. 생성 순서와 id를 사용해 상태 변경 전후 순서를 고정한다.
  let query = client
    .from("events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });
  if (isEventReviewStatus(status)) query = query.eq("review_status", status);
  const start = Math.max(0, (page - 1) * pageSize);
  query = query.range(start, start + pageSize - 1);
  const { data, count, error } = await query;
  if (error) throw new Error(`관리자 행사 목록을 불러오지 못했습니다: ${error.message}`);
  return { events: data ?? [], totalCount: count ?? 0 };
}

export async function getAdminEventStatusCounts(): Promise<Record<EventReviewStatus, number>> {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return { pending: 0, published: 0, rejected: 0 };

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
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return null;
  const result = await client
    .from("events")
    .select("*, event_occurrences(id, starts_at, ends_at)")
    .eq("id", id)
    .maybeSingle();
  const fallback = result.error && result.error.message.includes("event_occurrences")
    ? await client.from("events").select("*").eq("id", id).maybeSingle()
    : null;
  const { data, error } = fallback ?? result;
  if (error) throw new Error(`행사를 불러오지 못했습니다: ${error.message}`);
  return data;
}

export async function getAdminPlaces() {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("places").select("*").order("name");
  if (error) throw new Error(`명소 목록을 불러오지 못했습니다: ${error.message}`);
  return data ?? [];
}

export async function getAdminPlace(id: string) {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("places").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`명소를 불러오지 못했습니다: ${error.message}`);
  return data;
}

export async function getAdminEventReports() {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("event_reports")
    .select("id, title, body, source_url, review_status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`제보 목록을 불러오지 못했습니다: ${error.message}`);
  return data ?? [];
}

export async function getAdminEventCollectionExclusions(): Promise<AdminEventCollectionExclusion[]> {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return [];
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
  if (error && error.message.includes("event_deletion_tombstones")
    && (error.message.includes("schema cache") || error.message.includes("does not exist"))) {
    return [];
  }
  if (error) throw new Error(`재수집 제외 목록을 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    originalTitle: row.original_title ? String(row.original_title) : null,
    originalSlug: row.original_slug ? String(row.original_slug) : null,
    deletedAt: String(row.deleted_at),
    deletedBy: row.deleted_by ? String(row.deleted_by) : null,
    reason: row.reason ? String(row.reason) : null,
    identities: (row.event_deletion_identities ?? []).map((identity) => ({
      kind: String(identity.kind),
      identityValue: String(identity.identity_value),
      sourceUrl: identity.source_url ? String(identity.source_url) : null,
    })),
  }));
}

export async function getAdminSiteFeedback() {
  const client = await createAuthenticatedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("site_feedback")
    .select("id, title, body, link_url, image_path, review_status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`의견 목록을 불러오지 못했습니다: ${error.message}`);
  return Promise.all((data ?? []).map(async (feedback) => {
    if (!feedback.image_path) return { ...feedback, image_url: null };
    const { data: image, error: imageError } = await client.storage
      .from("feedback-images")
      .createSignedUrl(feedback.image_path, 60 * 60);
    if (imageError) {
      console.error("Site feedback image URL creation failed", imageError.message);
      return { ...feedback, image_url: null };
    }
    return { ...feedback, image_url: image.signedUrl };
  }));
}
