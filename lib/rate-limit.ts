import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { getServerEnv } from "@/lib/env.server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const HMAC_CONTEXT = "sokcho-moa:public-submission-rate-limit:client-address:v1";
const UNAVAILABLE_RETRY_AFTER_SECONDS = 60;

export type PublicSubmissionRateLimitScope = "event_report" | "site_feedback";

const policies = {
  event_report: { limit: 10, windowSeconds: 10 * 60 },
  site_feedback: { limit: 5, windowSeconds: 10 * 60 },
} satisfies Record<PublicSubmissionRateLimitScope, { limit: number; windowSeconds: number }>;

export type PublicSubmissionRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function normalizedAddress(value: string | null) {
  if (!value) return null;
  const address = value.trim().toLowerCase();
  return isIP(address) ? address : null;
}

/**
 * 믿을 수 있는 방문자 IP만 쓴다. Vercel은 x-vercel-forwarded-for를 직접 채우므로 믿고,
 * Vercel 밖의 운영 환경은 프록시 경계를 알 수 없어 IP를 쓰지 않는다(그러면 요청을 거부한다).
 */
function trustedClientAddress(requestHeaders: Pick<Headers, "get">) {
  if (process.env.VERCEL === "1") {
    return (
      normalizedAddress(requestHeaders.get("x-vercel-forwarded-for")) ??
      normalizedAddress(requestHeaders.get("x-forwarded-for"))
    );
  }
  if (process.env.NODE_ENV === "production") return null;
  return (
    normalizedAddress(requestHeaders.get("x-forwarded-for")) ??
    normalizedAddress(requestHeaders.get("x-real-ip"))
  );
}

function unavailableResult(): PublicSubmissionRateLimitResult {
  return { allowed: false, retryAfterSeconds: UNAVAILABLE_RETRY_AFTER_SECONDS };
}

/**
 * IP를 HMAC(비밀키로 만든 해시)으로 바꿔 DB의 고정 창 카운터에 기록한다. 원래 IP는 저장하지 않는다.
 * 설정이 없거나 확인에 실패하면 요청을 거부한다(fail closed). 스팸을 받는 것보다 잠시 막는 쪽이 안전하다.
 */
export async function checkPublicSubmissionRateLimit(
  scope: PublicSubmissionRateLimitScope,
): Promise<PublicSubmissionRateLimitResult> {
  const policy = policies[scope];
  if (!policy) return unavailableResult();

  try {
    const clientAddress = trustedClientAddress(await headers());
    const hmacKey = getServerEnv().SUBMISSION_RATE_LIMIT_HMAC_SECRET;
    const client = createAdminSupabaseClient();
    if (!clientAddress || !hmacKey || !client) return unavailableResult();

    const keyHash = createHmac("sha256", hmacKey)
      .update(HMAC_CONTEXT)
      .update("\0")
      .update(scope)
      .update("\0")
      .update(clientAddress)
      .digest("hex");
    const { data, error } = await client.rpc("consume_public_submission_rate_limit", {
      p_scope: scope,
      p_key_hash: keyHash,
      p_limit: policy.limit,
      p_window_seconds: policy.windowSeconds,
    });

    if (error) {
      console.error("Public submission rate-limit RPC failed", error.message);
      return unavailableResult();
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (
      !row ||
      typeof row.allowed !== "boolean" ||
      !Number.isInteger(row.retry_after_seconds) ||
      row.retry_after_seconds < 0
    ) {
      console.error("Public submission rate-limit RPC returned an invalid result");
      return unavailableResult();
    }

    return { allowed: row.allowed, retryAfterSeconds: row.retry_after_seconds };
  } catch (error) {
    console.error(
      "Public submission rate-limit check failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return unavailableResult();
  }
}
