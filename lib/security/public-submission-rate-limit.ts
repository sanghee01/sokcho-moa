import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";

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

function trustedClientAddress(requestHeaders: Pick<Headers, "get">) {
  if (process.env.VERCEL === "1") {
    // Vercel supplies this copy even when an upstream proxy changes x-forwarded-for.
    return (
      normalizedAddress(requestHeaders.get("x-vercel-forwarded-for")) ??
      normalizedAddress(requestHeaders.get("x-forwarded-for"))
    );
  }

  // Non-Vercel production proxies have no established trust boundary in this app.
  // Local development may still use the framework-provided address headers.
  if (process.env.NODE_ENV === "production") return null;
  return (
    normalizedAddress(requestHeaders.get("x-forwarded-for")) ??
    normalizedAddress(requestHeaders.get("x-real-ip"))
  );
}

function unavailableResult(): PublicSubmissionRateLimitResult {
  return { allowed: false, retryAfterSeconds: UNAVAILABLE_RETRY_AFTER_SECONDS };
}

export async function checkPublicSubmissionRateLimit(
  scope: PublicSubmissionRateLimitScope,
): Promise<PublicSubmissionRateLimitResult> {
  const policy = policies[scope];
  if (!policy) return unavailableResult();

  try {
    const clientAddress = trustedClientAddress(await headers());
    const hmacKey =
      process.env.SUBMISSION_RATE_LIMIT_HMAC_SECRET ??
      (process.env.NODE_ENV === "production" ? undefined : process.env.SUPABASE_SERVICE_ROLE_KEY);
    const client = createServiceRoleSupabaseClient();
    if (!clientAddress || !hmacKey || hmacKey.length < 32 || !client) return unavailableResult();

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

    return {
      allowed: row.allowed,
      retryAfterSeconds: row.retry_after_seconds,
    };
  } catch (error) {
    console.error(
      "Public submission rate-limit check failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return unavailableResult();
  }
}
