import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { getRuntimeEnv } from "@/lib/env";
import { getSubmissionRateLimitHmacSecret } from "@/lib/env.server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const HMAC_CONTEXT = "sokcho-moa:public-submission-rate-limit:client-address:v1";
const UNAVAILABLE_RETRY_AFTER_SECONDS = 60;

export type PublicSubmissionRateLimitScope = "event_report" | "site_feedback" | "event_view";

/**
 * event_view는 방문자(IP)·행사(slug)마다 센다. 10분에 10회면 새로고침·같은 공유기(NAT) 사용자는 거의 다
 * 세면서, IP 하나가 한 행사의 조회수를 올릴 수 있는 양은 하루 1,440회로 묶인다.
 */
const policies = {
  event_report: { limit: 10, windowSeconds: 10 * 60 },
  site_feedback: { limit: 5, windowSeconds: 10 * 60 },
  event_view: { limit: 10, windowSeconds: 10 * 60 },
} satisfies Record<PublicSubmissionRateLimitScope, { limit: number; windowSeconds: number }>;

export interface PublicSubmissionRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface PublicSubmissionRateLimitOptions {
  /** 같은 scope 안에서 따로 셀 대상(예: 행사 slug). 원문은 저장하지 않고 HMAC에만 들어간다. */
  subject?: string;
}

/** 압축(::)·IPv4 꼬리를 풀어 8개의 16비트 그룹으로 만든다. isIP()로 IPv6임을 확인한 값만 받는다. */
function ipv6Groups(address: string) {
  let value = address;
  const ipv4Tail = value.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Tail) {
    const [a, b, c, d] = ipv4Tail.slice(1).map(Number);
    value = `${value.slice(0, ipv4Tail.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = value.split("::");
  const headGroups = head ? head.split(":") : [];
  if (tail === undefined) return headGroups.map((group) => parseInt(group, 16));
  const tailGroups = tail ? tail.split(":") : [];
  const zeros = Array<string>(8 - headGroups.length - tailGroups.length).fill("0");
  return [...headGroups, ...zeros, ...tailGroups].map((group) => parseInt(group, 16));
}

/**
 * 요청 제한에 쓸 주소 단위. IPv4는 주소 하나, IPv6는 /64 대역이다.
 * 한 가정·기기는 보통 /64 하나를 받아 그 안의 주소를 마음대로 바꿀 수 있어 /128로 세면 제한을 피할 수 있다.
 */
function normalizedAddress(value: string | null) {
  if (!value) return null;
  const address = value.trim().toLowerCase();
  const version = isIP(address);
  if (version === 4) return address;
  if (version !== 6) return null;

  const groups = ipv6Groups(address);
  if (groups.length !== 8 || groups.some((group) => !Number.isInteger(group))) return null;
  // IPv4-mapped(::ffff:a.b.c.d)는 실제로 IPv4 방문자다.
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join(".");
  }
  return `${groups.slice(0, 4).map((group) => group.toString(16)).join(":")}::/64`;
}

/**
 * 믿을 수 있는 방문자 IP만 쓴다. Vercel은 x-vercel-forwarded-for를 직접 채우므로 믿고,
 * Vercel 밖의 운영 환경은 프록시 경계를 알 수 없어 IP를 쓰지 않는다(그러면 요청을 거부한다).
 */
function trustedClientAddress(requestHeaders: Pick<Headers, "get">) {
  const runtime = getRuntimeEnv();
  if (runtime.isVercel) {
    return (
      normalizedAddress(requestHeaders.get("x-vercel-forwarded-for")) ??
      normalizedAddress(requestHeaders.get("x-forwarded-for"))
    );
  }
  if (runtime.isProduction) return null;
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
  options: PublicSubmissionRateLimitOptions = {},
): Promise<PublicSubmissionRateLimitResult> {
  const policy = policies[scope];
  if (!policy) return unavailableResult();

  try {
    const clientAddress = trustedClientAddress(await headers());
    const hmacKey = getSubmissionRateLimitHmacSecret();
    const client = createAdminSupabaseClient();
    if (!clientAddress || !hmacKey || !client) {
      // 값 자체(비밀값·IP)는 남기지 않고 무엇이 빠졌는지만 남긴다. 운영에서 설정이 빠지면 모든 요청이 거부되기 때문이다.
      const missing = [
        !hmacKey && "SUBMISSION_RATE_LIMIT_HMAC_SECRET (hmac secret)",
        !client && "SUPABASE_SECRET_KEY (server client)",
        !clientAddress && "trusted client address",
      ].filter(Boolean);
      console.error(`Public submission rate limit unavailable (${scope}): missing ${missing.join(", ")}`);
      return unavailableResult();
    }

    const hmac = createHmac("sha256", hmacKey)
      .update(HMAC_CONTEXT)
      .update("\0")
      .update(scope)
      .update("\0")
      .update(clientAddress);
    // subject가 없을 때의 key는 이전과 같게 유지해 배포 중 기존 제출 카운터가 초기화되지 않게 한다.
    if (options.subject !== undefined) hmac.update("\0").update(options.subject);
    const keyHash = hmac.digest("hex");
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
