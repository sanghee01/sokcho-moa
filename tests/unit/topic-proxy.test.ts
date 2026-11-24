import { afterEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(async () => undefined),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: supabaseMocks.createServerClient,
}));

import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("topic proxy", () => {
  it("registry에 없는 주제를 Next.js not-found로 HTTP 404 rewrite한다", async () => {
    const response = await proxy(
      new NextRequest("https://sokcho-moa.vercel.app/topics/unknown"),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://sokcho-moa.vercel.app/_not-found",
    );
  });

  it("유효한 주제와 query 필터는 변경하지 않고 통과시킨다", async () => {
    const response = await proxy(
      new NextRequest(
        "https://sokcho-moa.vercel.app/topics/festival?when=month&audience=family",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("관리자 요청의 기존 Supabase 인증 확인을 유지한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    supabaseMocks.createServerClient.mockReturnValue({
      auth: { getClaims: supabaseMocks.getClaims },
    });

    const response = await proxy(
      new NextRequest("https://sokcho-moa.vercel.app/admin/events"),
    );

    expect(response.status).toBe(200);
    expect(supabaseMocks.createServerClient).toHaveBeenCalledOnce();
    expect(supabaseMocks.getClaims).toHaveBeenCalledOnce();
  });

  // 리다이렉트를 그리기 전에 보내려고 /?q=, /months, /calendar를 더했다. cacheComponents에서는 페이지 안의 redirect()가
  // 307·308이 아니라 200 + 브라우저 이동이 되기 때문이다(2026-11-24 사용자 결정). 홈은 ?q=가 있을 때만, 그 밖의 공개 페이지에서는 돌지 않는다.
  it("proxy matcher가 리다이렉트할 주소와 관리자·주제 경로만 포함한다", () => {
    expect(config.matcher).toEqual([
      { source: "/", has: [{ type: "query", key: "q" }] },
      "/months",
      "/calendar",
      "/admin/:path*",
      "/topics/:path*",
    ]);
  });
});

describe("redirect proxy", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("/months는 요청한 때의 서울 기준 이번 달로 307 리다이렉트한다", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 2026-12-01 00:30 KST(UTC로는 11월 30일)
    vi.setSystemTime(new Date("2026-11-30T15:30:00.000Z"));
    const response = await proxy(new NextRequest("https://sokcho-moa.vercel.app/months"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sokcho-moa.vercel.app/months/2026-12");
  });

  it("/calendar는 같은 필터의 목록으로 307 리다이렉트하고 바깥 주소로는 보내지 않는다", async () => {
    const response = await proxy(new NextRequest("https://sokcho-moa.vercel.app/calendar?category=festival&view=month&month=2026-07&__browsePath=//evil.example"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sokcho-moa.vercel.app/?category=festival");
  });

  it.each(["/", "/topics/festival"])("예전 검색 주소 %s?q=는 통합 검색의 행사 결과로 308 리다이렉트한다", async (path) => {
    const response = await proxy(new NextRequest(`https://sokcho-moa.vercel.app${path}?q=%20%EB%B0%94%EB%8B%A4%EB%B9%9B%20&sort=views`));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://sokcho-moa.vercel.app/search?q=%EB%B0%94%EB%8B%A4%EB%B9%9B&type=events");
  });

  it("검색어가 없는 홈은 그대로 통과시킨다", async () => {
    const response = await proxy(new NextRequest("https://sokcho-moa.vercel.app/?q=%20&sort=views"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
