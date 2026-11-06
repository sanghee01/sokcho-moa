import { beforeEach, describe, expect, it, vi } from "vitest";

// 행사 상세 조회수 API. 올바른 slug만 요청 제한을 거쳐 서버 전용 client로 RPC를 부르고,
// 결과(성공·요청 제한·행사 없음·DB 오류)를 상태 코드로 구분한다.
// 호출하는 화면은 응답을 기다리지 않으므로(fire-and-forget) 어떤 결과든 화면에는 영향이 없다.
const mocks = vi.hoisted(() => ({
  createAdminSupabaseClient: vi.fn(),
  checkPublicSubmissionRateLimit: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mocks.createAdminSupabaseClient,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkPublicSubmissionRateLimit: mocks.checkPublicSubmissionRateLimit,
}));

import { POST } from "@/app/api/events/[slug]/view/route";

function viewRequest(slug: string) {
  const request = new Request(`http://localhost:3000/api/events/${encodeURIComponent(slug)}/view`, { method: "POST" });
  return POST(request, { params: Promise.resolve({ slug }) });
}

describe("POST /api/events/[slug]/view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.createAdminSupabaseClient.mockReturnValue({ rpc: mocks.rpc });
    mocks.checkPublicSubmissionRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it.each([
    ["대문자", "Summer-Festival"],
    ["경로 이동", "../admin"],
    ["밑줄", "summer_festival"],
    ["앞뒤 하이픈", "-summer-"],
    ["SQL 조각", "a';drop table events;--"],
    ["빈 문자열", ""],
  ])("slug가 %s이면 400이고 요청 제한·DB를 부르지 않는다", async (_, slug) => {
    const response = await viewRequest(slug);

    expect(response.status).toBe(400);
    expect(mocks.checkPublicSubmissionRateLimit).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("공개 행사의 조회수를 올리면 204를 돌려준다", async () => {
    mocks.rpc.mockResolvedValue({ data: 8, error: null });

    const response = await viewRequest("summer-festival-2026");

    expect(response.status).toBe(204);
    expect(mocks.rpc).toHaveBeenCalledWith("increment_event_view", { p_slug: "summer-festival-2026" });
  });

  // 같은 방문자가 같은 행사 조회수를 반복해서 올리지 못하게 행사(slug)별로 요청 수를 센다.
  it("같은 방문자의 같은 행사 요청 수를 제한한다", async () => {
    await viewRequest("summer-festival-2026");

    expect(mocks.checkPublicSubmissionRateLimit).toHaveBeenCalledWith("event_view", {
      subject: "summer-festival-2026",
    });
  });

  it("요청 제한에 걸리면 429와 재시도 시간을 돌려주고 조회수를 올리지 않는다", async () => {
    mocks.checkPublicSubmissionRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 117 });

    const response = await viewRequest("summer-festival-2026");

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("117");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  // RPC는 slug에 해당하는 공개 행사가 없으면(없는 행사·비공개 행사·샘플 행사) 오류 없이 null을 돌려준다.
  it("올릴 공개 행사가 없으면 404를 돌려준다", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    const response = await viewRequest("missing-event");

    expect(response.status).toBe(404);
  });

  it("DB 오류는 성공으로 숨기지 않고 서버 로그에 남긴 뒤 500을 돌려준다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "connection refused", code: "08006" } });

    const response = await viewRequest("summer-festival-2026");

    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("서버 전용 키 설정이 없으면 서버 로그에 남기고 503을 돌려준다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.createAdminSupabaseClient.mockReturnValue(null);

    const response = await viewRequest("summer-festival-2026");

    expect(response.status).toBe(503);
    expect(consoleError).toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
