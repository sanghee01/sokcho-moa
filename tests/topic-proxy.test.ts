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
    vi.stubEnv("NEXT_PUBLIC_DATA_MODE", "supabase");
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

  it("운영 환경의 E2E 전용 경로를 HTTP 404로 차단한다", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await proxy(
      new NextRequest("https://sokcho-moa.vercel.app/e2e-test/header"),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://sokcho-moa.vercel.app/_not-found",
    );
  });

  it("proxy matcher가 관리자·주제·E2E 전용 경로를 포함한다", () => {
    expect(config.matcher).toEqual([
      "/admin/:path*",
      "/topics/:path*",
      "/e2e-test/:path*",
    ]);
  });
});
