import { beforeEach, describe, expect, it, vi } from "vitest";

// 행사 공개 상태 변경: 최초 공개일을 지키고, 캐시·검색엔진 알림은 DB의 실제 slug와 공개 여부로 정한다.
const mocks = vi.hoisted(() => ({
  current: null as null | { slug: string; category: string; review_status: string; published_at: string | null; event_start_at?: string | null },
  updates: [] as Record<string, unknown>[],
  expirePublicEvents: vi.fn(),
  notifyIndexNow: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: vi.fn(async () => ({ id: "admin", email: "admin@example.com" })) }));
vi.mock("@/features/events/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/events/cache")>()),
  expirePublicEvents: mocks.expirePublicEvents,
}));
vi.mock("@/lib/seo/indexnow", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/seo/indexnow")>()),
  notifyIndexNow: mocks.notifyIndexNow,
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => unknown) => callback(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSessionSupabaseClient: async () => ({
    from: () => {
      let pendingUpdate: Record<string, unknown> | null = null;
      const builder = {
        select: () => builder,
        eq: () => builder,
        update: (values: Record<string, unknown>) => {
          pendingUpdate = values;
          mocks.updates.push(values);
          return builder;
        },
        maybeSingle: async () => ({ data: mocks.current, error: null }),
        single: async () => ({ data: { ...mocks.current, ...pendingUpdate }, error: null }),
      };
      return builder;
    },
  }),
}));

import { setEventReviewStatusAction } from "@/features/events/admin/actions";

const ID = "3f2b8c1e-5d4a-4e6b-9c7d-0a1b2c3d4e5f";
const FIRST_PUBLISHED = "2026-07-01T00:00:00.000Z";

describe("행사 공개 상태 변경", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updates = [];
  });

  it("다시 공개해도 처음 공개한 날짜를 유지한다", async () => {
    mocks.current = { slug: "real-slug", category: "festival", review_status: "pending", published_at: FIRST_PUBLISHED, event_start_at: "2026-08-01T00:00:00.000Z" };
    await setEventReviewStatusAction({ id: ID, status: "published" });
    expect(mocks.updates[0]).toMatchObject({ review_status: "published", published_at: FIRST_PUBLISHED });
  });

  it("처음 공개하면 공개 시각을 기록하고, 비공개로 바꿔도 지우지 않는다", async () => {
    mocks.current = { slug: "real-slug", category: "festival", review_status: "pending", published_at: null, event_start_at: "2026-08-01T00:00:00.000Z" };
    await setEventReviewStatusAction({ id: ID, status: "published" });
    expect(mocks.updates[0].published_at).toEqual(expect.any(String));

    mocks.current = { slug: "real-slug", category: "festival", review_status: "published", published_at: FIRST_PUBLISHED, event_start_at: "2026-08-01T00:00:00.000Z" };
    await setEventReviewStatusAction({ id: ID, status: "pending" });
    expect(mocks.updates[1]).toMatchObject({ review_status: "pending", published_at: FIRST_PUBLISHED });
  });

  it("화면이 보낸 slug가 아니라 DB의 slug로 캐시를 만료한다", async () => {
    mocks.current = { slug: "real-slug", category: "festival", review_status: "pending", published_at: null, event_start_at: "2026-08-01T00:00:00.000Z" };
    await setEventReviewStatusAction({ id: ID, slug: "stale-slug", status: "published" });
    expect(mocks.expirePublicEvents).toHaveBeenCalledWith("real-slug");
  });

  it("공개와 무관한 변경(대기↔반려)은 검색엔진에 알리지 않는다", async () => {
    mocks.current = { slug: "real-slug", category: "festival", review_status: "pending", published_at: null, event_start_at: "2026-08-01T00:00:00.000Z" };
    await setEventReviewStatusAction({ id: ID, status: "rejected" });
    expect(mocks.notifyIndexNow).not.toHaveBeenCalled();
  });

  it("공개하거나 공개를 내리면 검색엔진에 알린다", async () => {
    mocks.current = { slug: "real-slug", category: "festival", review_status: "published", published_at: FIRST_PUBLISHED, event_start_at: "2026-08-01T00:00:00.000Z" };
    await setEventReviewStatusAction({ id: ID, status: "rejected" });
    expect(mocks.notifyIndexNow).toHaveBeenCalledTimes(1);
  });

  it("시작 일시가 없는 행사는 공개하지 않고 이유를 알려 준다", async () => {
    mocks.current = { slug: "real-slug", category: "festival", review_status: "pending", published_at: null, event_start_at: null };
    await expect(setEventReviewStatusAction({ id: ID, status: "published" })).rejects.toThrow(/시작/);
    expect(mocks.updates).toHaveLength(0);
  });
});
