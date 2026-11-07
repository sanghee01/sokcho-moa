import { beforeEach, describe, expect, it, vi } from "vitest";

// 후보 JSON으로 등록한 행사도 관리자가 직접 작성한 행사와 같은 slug 규칙(event-<uuid>)을 쓴다.
// 예전에는 candidate-<시각>이라 같은 행사 데이터의 공개 주소 규칙이 두 가지였다(2026-11-07).
const mocks = vi.hoisted(() => ({
  createdEventSlugs: [] as string[],
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: vi.fn(async () => ({ id: "admin", email: "admin@example.com" })) }));
vi.mock("@/lib/supabase/server", () => ({
  createSessionSupabaseClient: vi.fn(async () => ({
    rpc: vi.fn(async (name: string, args: { p_event?: { slug: string } }) => {
      if (name === "create_event_with_source" && args.p_event) mocks.createdEventSlugs.push(args.p_event.slug);
      // 재수집 제외 확인(is_event_collection_excluded)은 "제외 아님", 저장 RPC는 새 행사 id를 돌려준다.
      return { data: name === "create_event_with_source" ? "3f2b8c1e-5d4a-4e6b-9c7d-0a1b2c3d4e5f" : false, error: null };
    }),
  })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
}));

import { importEventCandidateAction } from "@/features/events/admin/candidate/actions";
import { slugSchema } from "@/lib/slug";

const candidateJson = JSON.stringify({
  title: "확인된 행사명",
  summary: null,
  description: null,
  category: null,
  audiences: [],
  eventStartAt: null,
  eventEndAt: null,
  operatingHours: null,
  applicationStartAt: null,
  applicationEndAt: null,
  locationName: null,
  address: null,
  latitude: null,
  longitude: null,
  priceText: null,
  isFree: null,
  organizer: null,
  contact: null,
  officialUrl: null,
  applicationUrl: null,
  imageUrl: null,
  sourceName: "속초시청",
  sourceUrl: "https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=1",
});

describe("수집 후보 등록", () => {
  beforeEach(() => {
    mocks.createdEventSlugs = [];
  });

  it("관리자 작성과 같은 event-<uuid> slug로 등록한다", async () => {
    const formData = new FormData();
    formData.set("candidateJson", candidateJson);

    await expect(importEventCandidateAction({ error: null }, formData))
      .rejects.toMatchObject({ url: expect.stringContaining("result=event-imported") });

    expect(mocks.createdEventSlugs).toHaveLength(1);
    expect(mocks.createdEventSlugs[0]).toMatch(/^event-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(slugSchema.safeParse(mocks.createdEventSlugs[0]).success).toBe(true);
  });
});
