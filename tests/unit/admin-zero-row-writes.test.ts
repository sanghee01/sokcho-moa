import { beforeEach, describe, expect, it, vi } from "vitest";

// RLS에 막히거나 이미 삭제된 행을 바꾸면 Supabase는 오류 없이 0행을 처리한다.
// 관리자 action은 이것을 성공으로 보고하면 안 된다(화면은 바뀐 것처럼 보이지만 DB는 그대로).
const mocks = vi.hoisted(() => ({
  createSessionSupabaseClient: vi.fn(),
  affectedRows: [] as { id: string }[],
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: vi.fn(async () => ({ id: "admin", email: "admin@example.com" })) }));
vi.mock("@/lib/supabase/server", () => ({ createSessionSupabaseClient: mocks.createSessionSupabaseClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
}));

/** 어떤 query builder 메서드를 이어 불러도 마지막에 { data: affectedRows } 를 돌려주는 가짜 client */
function fakeClient() {
  const builder: Record<string, unknown> = {};
  for (const method of ["update", "delete", "eq", "select"]) builder[method] = () => builder;
  builder.maybeSingle = async () => ({ data: null, error: null });
  builder.then = (resolve: (value: unknown) => unknown) => resolve({ data: mocks.affectedRows, error: null });
  return { from: () => builder, storage: { from: () => ({ remove: async () => ({ error: null }) }) } };
}

import { deleteEventReportAction, setEventReportReviewStatusAction } from "@/features/reports/admin/actions";
import { deleteSiteFeedbackAction, setSiteFeedbackReviewStatusAction } from "@/features/feedback/admin/actions";
import { deletePlaceAction } from "@/features/places/admin/actions";

const ID = "3f2b8c1e-5d4a-4e6b-9c7d-0a1b2c3d4e5f";

function placeDeleteForm() {
  const data = new FormData();
  data.set("id", ID);
  data.set("confirmation", "delete");
  return data;
}

const writes = [
  ["제보 상태 변경", () => setEventReportReviewStatusAction({ id: ID, status: "reviewed" })],
  ["제보 삭제", () => deleteEventReportAction({ id: ID })],
  ["의견 상태 변경", () => setSiteFeedbackReviewStatusAction({ id: ID, status: "reviewed" })],
  ["의견 삭제", () => deleteSiteFeedbackAction({ id: ID })],
] as const;

describe("관리자 쓰기가 0행을 처리하면 성공으로 보고하지 않는다", () => {
  beforeEach(() => {
    mocks.createSessionSupabaseClient.mockImplementation(async () => fakeClient());
  });

  it.each(writes)("%s: 바뀐 행이 없으면 실패한다", async (_, run) => {
    mocks.affectedRows = [];
    const result = await run();
    expect(result.error).toBeTruthy();
  });

  it.each(writes)("%s: 행이 바뀌면 성공한다", async (_, run) => {
    mocks.affectedRows = [{ id: ID }];
    const result = await run();
    expect(result.error).toBeNull();
  });

  it("명소 삭제: 지운 행이 없으면 오류 문장을 돌려주고 목록으로 보내지 않는다", async () => {
    mocks.affectedRows = [];
    const result = await deletePlaceAction({ error: null }, placeDeleteForm());
    expect(result.error).toBeTruthy();
  });

  it("명소 삭제: 지우면 명소 목록으로 보낸다", async () => {
    mocks.affectedRows = [{ id: ID }];
    await expect(deletePlaceAction({ error: null }, placeDeleteForm())).rejects.toMatchObject({ url: expect.stringContaining("tab=places") });
  });
});
