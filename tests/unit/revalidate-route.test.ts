import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 외부 수집기용 캐시 무효화 API. 비밀값이 맞을 때만 Next 캐시를 무효화하는지 확인한다.
const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
  updateTag: mocks.updateTag,
}));

import { POST } from "@/app/api/revalidate/route";

const SECRET = "unit-test-revalidate-secret-0123456789";

function revalidateRequest({ authorization, body }: { authorization?: string; body?: unknown } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    headers,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

function revalidationTriggered() {
  return mocks.revalidateTag.mock.calls.length + mocks.revalidatePath.mock.calls.length + mocks.updateTag.mock.calls.length > 0;
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("비밀값이 설정되지 않았으면 503으로 거부하고 캐시를 건드리지 않는다", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");

    const response = await POST(revalidateRequest({ authorization: `Bearer ${SECRET}`, body: {} }));

    expect(response.status).toBe(503);
    expect(revalidationTriggered()).toBe(false);
  });

  it.each([
    ["Authorization 헤더 없음", undefined],
    ["Bearer 접두어 없이 비밀값만", SECRET],
    ["길이가 같은 다른 비밀값", `Bearer ${"x".repeat(SECRET.length)}`],
    ["길이가 다른 비밀값", "Bearer short-secret"],
    ["비밀값 뒤에 문자를 덧붙임", `Bearer ${SECRET}x`],
    ["소문자 bearer", `bearer ${SECRET}`],
  ])("%s이면 401이고 캐시를 무효화하지 않는다", async (_, authorization) => {
    const response = await POST(revalidateRequest({ authorization, body: { slug: "summer-festival" } }));

    expect(response.status).toBe(401);
    expect(revalidationTriggered()).toBe(false);
  });

  it("인증은 본문 검증보다 먼저 한다: 틀린 비밀값 + 잘못된 본문은 401이다", async () => {
    const response = await POST(revalidateRequest({ authorization: "Bearer wrong", body: { slug: "Not A Slug" } }));

    expect(response.status).toBe(401);
    expect(revalidationTriggered()).toBe(false);
  });

  it.each([
    ["대문자와 공백", "Not A Slug"],
    ["경로 이동", "../admin"],
    ["밑줄", "summer_festival"],
    ["하이픈 연속", "summer--festival"],
    ["빈 문자열", ""],
    ["문자열이 아님", 123],
  ])("slug가 %s이면 400이고 캐시를 무효화하지 않는다", async (_, slug) => {
    const response = await POST(revalidateRequest({ authorization: `Bearer ${SECRET}`, body: { slug } }));

    expect(response.status).toBe(400);
    expect(revalidationTriggered()).toBe(false);
  });

  it("올바른 비밀값과 slug면 공개 행사 캐시와 그 행사 상세 경로를 무효화한다", async () => {
    const response = await POST(revalidateRequest({ authorization: `Bearer ${SECRET}`, body: { slug: "summer-festival" } }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ revalidated: true, slug: "summer-festival" });
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-events", "max");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/events/summer-festival");
  });

  it("slug 없이(본문 없음) 호출하면 목록 캐시만 무효화한다", async () => {
    const response = await POST(revalidateRequest({ authorization: `Bearer ${SECRET}` }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ revalidated: true, slug: null });
    expect(mocks.revalidateTag).toHaveBeenCalledWith("public-events", "max");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath.mock.calls.some(([path]) => String(path).startsWith("/events/"))).toBe(false);
  });

  it("본문이 있는데 JSON이 깨져 있으면 성공으로 넘기지 않고 400을 돌려준다", async () => {
    const response = await POST(revalidateRequest({ authorization: `Bearer ${SECRET}`, body: '{"slug": "summer-' }));

    expect(response.status).toBe(400);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});
