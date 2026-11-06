import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv } from "@/lib/env";
import { getRevalidateSecret, getSubmissionRateLimitHmacSecret } from "@/lib/env.server";

afterEach(() => vi.unstubAllEnvs());

describe("사이트 주소(NEXT_PUBLIC_SITE_URL)", () => {
  it("설정한 값이 있으면 그대로 쓴다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sokcho-moa.vercel.app");
    expect(getPublicEnv().NEXT_PUBLIC_SITE_URL).toBe("https://sokcho-moa.vercel.app");
  });

  it("Vercel 운영 배포에서 빠졌으면 localhost가 아니라 운영 도메인을 쓴다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "sokcho-moa.vercel.app");
    vi.stubEnv("VERCEL_URL", "sokcho-moa-abc123.vercel.app");
    expect(getPublicEnv().NEXT_PUBLIC_SITE_URL).toBe("https://sokcho-moa.vercel.app");
  });

  it("Vercel preview 배포에서 빠졌으면 그 배포 주소를 쓴다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "sokcho-moa-abc123.vercel.app");
    expect(getPublicEnv().NEXT_PUBLIC_SITE_URL).toBe("https://sokcho-moa-abc123.vercel.app");
  });

  it("Vercel 밖(로컬)에서 빠졌으면 localhost를 쓴다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getPublicEnv().NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });
});

describe("서버 비밀값은 기능별로 검증한다", () => {
  it("캐시 무효화 비밀값 형식이 틀려도 요청 제한 비밀값은 읽을 수 있다", () => {
    vi.stubEnv("REVALIDATE_SECRET", "too-short");
    vi.stubEnv("SUBMISSION_RATE_LIMIT_HMAC_SECRET", "x".repeat(32));
    expect(getSubmissionRateLimitHmacSecret()).toBe("x".repeat(32));
    expect(() => getRevalidateSecret()).toThrow();
  });

  it("값이 없으면 그 기능만 꺼진다(undefined)", () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect(getRevalidateSecret()).toBeUndefined();
  });
});
