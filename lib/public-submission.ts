import "server-only";
import { checkPublicSubmissionRateLimit, type PublicSubmissionRateLimitScope } from "@/lib/rate-limit";
import { createAdminSupabaseClient, type AdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * 로그인 없이 받는 방문자 제출(행사 제보, 서비스 의견)의 공통 관문.
 * 방문자 쓰기는 RLS를 거치지 않는 admin client로 저장하므로, 여기서 서버가 직접 막는다.
 *
 * 1. 숨김 필드(website)를 채운 요청은 봇으로 보고 저장하지 않는다.
 * 2. 저장 설정이 없으면 "준비 중"으로 응답한다.
 * 3. 같은 IP의 요청 수를 제한한다.
 */
export const HONEYPOT_FIELD = "website";

export function isBotSubmission(formData: FormData) {
  const value = formData.get(HONEYPOT_FIELD);
  return typeof value === "string" && value.length > 0;
}

export async function openPublicSubmission(
  scope: PublicSubmissionRateLimitScope,
  unavailableMessage: string,
): Promise<{ client: AdminSupabaseClient } | { error: string }> {
  const client = createAdminSupabaseClient();
  if (!client) return { error: unavailableMessage };

  const rateLimit = await checkPublicSubmissionRateLimit(scope);
  if (!rateLimit.allowed) {
    const retryMinutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60));
    return { error: `요청이 많습니다. 약 ${retryMinutes}분 후 다시 시도해 주세요.` };
  }
  return { client };
}
