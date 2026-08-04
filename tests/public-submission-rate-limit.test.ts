import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceRoleSupabaseClient: vi.fn(),
  headers: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));

import { checkPublicSubmissionRateLimit } from "@/lib/security/public-submission-rate-limit";

describe("public submission rate limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SUBMISSION_RATE_LIMIT_HMAC_SECRET", "test-rate-limit-secret-at-least-32-characters");
    mocks.headers.mockResolvedValue(new Headers({ "x-vercel-forwarded-for": "203.0.113.9" }));
    mocks.createServiceRoleSupabaseClient.mockReturnValue({ rpc: mocks.rpc });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows a request and sends only a context-keyed HMAC address digest", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 0 }],
      error: null,
    });

    await expect(checkPublicSubmissionRateLimit("event_report")).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "consume_public_submission_rate_limit",
      expect.objectContaining({
        p_scope: "event_report",
        p_limit: 10,
        p_window_seconds: 600,
        p_key_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("203.0.113.9");
  });

  it("returns the database retry delay when the fixed window is exhausted", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: false, retry_after_seconds: 117 }],
      error: null,
    });

    await expect(checkPublicSubmissionRateLimit("event_report")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 117,
    });
  });

  it("keeps each form's policy and address hash separate", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 0 }],
      error: null,
    });

    await checkPublicSubmissionRateLimit("event_report");
    await checkPublicSubmissionRateLimit("site_feedback");

    const eventInput = mocks.rpc.mock.calls[0]?.[1];
    const feedbackInput = mocks.rpc.mock.calls[1]?.[1];
    expect(eventInput).toMatchObject({ p_scope: "event_report", p_limit: 10, p_window_seconds: 600 });
    expect(feedbackInput).toMatchObject({ p_scope: "site_feedback", p_limit: 5, p_window_seconds: 600 });
    expect(eventInput?.p_key_hash).not.toBe(feedbackInput?.p_key_hash);
  });

  it("uses Vercel's overwritten x-forwarded-for as a fallback", async () => {
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "198.51.100.4" }));
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 0 }],
      error: null,
    });

    await expect(checkPublicSubmissionRateLimit("event_report")).resolves.toMatchObject({ allowed: true });
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });

  it("does not trust spoofable forwarding headers outside Vercel production", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "198.51.100.4" }));

    await expect(checkPublicSubmissionRateLimit("event_report")).resolves.toMatchObject({ allowed: false });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed without a trusted client address", async () => {
    mocks.headers.mockResolvedValue(new Headers());

    await expect(checkPublicSubmissionRateLimit("event_report")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed instead of accepting a forwarded chain", async () => {
    mocks.headers.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.2" }),
    );

    await expect(checkPublicSubmissionRateLimit("event_report")).resolves.toMatchObject({ allowed: false });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed when the database RPC fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "database unavailable" } });

    await expect(checkPublicSubmissionRateLimit("event_report")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });
});
