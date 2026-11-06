import "server-only";
import { z } from "zod";

/**
 * 서버 비밀값은 이 파일에서만 읽는다. 비밀값마다 따로 검증해, 하나가 잘못돼도 그 값을 쓰는 기능만 멈춘다.
 * - 값이 없으면 undefined: 해당 기능만 꺼진다(예: 제보 접수 "준비 중").
 * - 형식이 틀리면 예외: 그 기능을 쓰는 요청에서 드러난다. 관계없는 기능은 계속 동작한다.
 */
function readSecret(name: string, schema: z.ZodType<string>) {
  const raw = process.env[name] || undefined;
  if (raw === undefined) return undefined;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Error(`서버 환경 변수 ${name} 설정이 올바르지 않습니다: ${z.prettifyError(parsed.error)}`);
  return parsed.data;
}

/** service_role(secret key). RLS를 거치지 않으므로 서버에서만 쓴다. */
export function getSupabaseSecretKey() {
  return readSecret("SUPABASE_SECRET_KEY", z.string().min(1));
}

/** 방문자 IP를 HMAC으로 바꿔 요청 제한에 쓰는 비밀값. */
export function getSubmissionRateLimitHmacSecret() {
  return readSecret("SUBMISSION_RATE_LIMIT_HMAC_SECRET", z.string().min(32, "32자 이상이어야 합니다."));
}

/** 외부 수집기가 /api/revalidate를 부를 때 쓰는 비밀값. */
export function getRevalidateSecret() {
  return readSecret("REVALIDATE_SECRET", z.string().min(16, "16자 이상이어야 합니다."));
}
