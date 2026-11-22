import { beforeEach, describe, expect, it, vi } from "vitest";

// 공지를 저장할 때 공개 시각(published_at)은 처음 공개하는 순간에만 찍는다.
// 고칠 때마다 바뀌면 상단 공지 띠가 다시 뜨고 목록 순서가 뒤집히기 때문이다(features/notices/admin/actions.ts).
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createSessionSupabaseClient: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

class RedirectSignal extends Error {}

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createSessionSupabaseClient: mocks.createSessionSupabaseClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath, updateTag: mocks.updateTag }));

import { saveNoticeAction } from "@/features/notices/admin/actions";

const ID = "3f2b8c1e-5d4a-4e6b-9c7d-0a1b2c3d4e5f";
const FIRST_PUBLISHED_AT = "2026-11-01T01:00:00.000Z";

interface SavedPayload {
  is_published: boolean;
  published_at: string | null;
}

/** 저장할 행을 기록하는 가짜 Supabase client. existing은 수정할 때 DB에 있던 행이다. */
function createFakeClient(existing: { published_at: string | null } | null) {
  const saved: { payload: SavedPayload | null } = { payload: null };
  const savedRow = { maybeSingle: async () => ({ data: { id: ID }, error: null }) };
  const client = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing, error: null }) }) }),
      update: (payload: SavedPayload) => {
        saved.payload = payload;
        return { eq: () => ({ select: () => savedRow }) };
      },
      insert: (payload: SavedPayload) => {
        saved.payload = payload;
        return { select: () => savedRow };
      },
    }),
  };
  return { client, saved };
}

function noticeForm({ id, isPublished }: { id?: string; isPublished: boolean }) {
  const data = new FormData();
  if (id !== undefined) data.append("id", id);
  data.append("kind", "notice");
  data.append("title", "설 연휴 안내");
  data.append("body", "연휴에도 행사 정보를 모아 둡니다.");
  if (isPublished) data.append("isPublished", "on");
  return data;
}

async function save(existing: { published_at: string | null } | null, formData: FormData) {
  const { client, saved } = createFakeClient(existing);
  mocks.createSessionSupabaseClient.mockResolvedValue(client);
  await expect(saveNoticeAction({ error: null }, formData)).rejects.toBeInstanceOf(RedirectSignal);
  return saved.payload;
}

describe("saveNoticeAction의 공개 시각", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ email: "admin@example.com" });
    mocks.redirect.mockImplementation(() => {
      throw new RedirectSignal();
    });
  });

  it("새 공지를 공개로 저장하면 지금 시각을 찍는다", async () => {
    const payload = await save(null, noticeForm({ isPublished: true }));
    expect(payload?.is_published).toBe(true);
    expect(Number.isNaN(Date.parse(payload?.published_at ?? ""))).toBe(false);
  });

  it("새 공지를 비공개로 저장하면 공개 시각을 비워 둔다", async () => {
    const payload = await save(null, noticeForm({ isPublished: false }));
    expect(payload?.published_at).toBeNull();
  });

  it("이미 공개한 공지를 고쳐도 처음 공개 시각을 그대로 둔다", async () => {
    const payload = await save({ published_at: FIRST_PUBLISHED_AT }, noticeForm({ id: ID, isPublished: true }));
    expect(payload?.published_at).toBe(FIRST_PUBLISHED_AT);
  });

  it("공개를 껐다가 다시 켜도 처음 공개 시각을 쓴다(공지 띠가 다시 뜨지 않음)", async () => {
    const hidden = await save({ published_at: FIRST_PUBLISHED_AT }, noticeForm({ id: ID, isPublished: false }));
    expect(hidden).toMatchObject({ is_published: false, published_at: FIRST_PUBLISHED_AT });
    const republished = await save({ published_at: FIRST_PUBLISHED_AT }, noticeForm({ id: ID, isPublished: true }));
    expect(republished?.published_at).toBe(FIRST_PUBLISHED_AT);
  });

  it("공개한 적 없는 공지를 처음 공개하면 그때 시각을 찍는다", async () => {
    const payload = await save({ published_at: null }, noticeForm({ id: ID, isPublished: true }));
    expect(payload?.published_at).not.toBeNull();
  });
});
