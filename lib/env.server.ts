import "server-only";
import { z } from "zod";

// 서버 비밀값은 이 파일에서만 읽는다. 값이 없으면 해당 기능만 꺼지고(예: 제보 접수),
// 형식이 틀리면 배포 직후 바로 드러나도록 예외를 던진다.
const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  SUBMISSION_RATE_LIMIT_HMAC_SECRET: z.string().min(32, "32자 이상이어야 합니다.").optional(),
  REVALIDATE_SECRET: z.string().min(16, "16자 이상이어야 합니다.").optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
    SUBMISSION_RATE_LIMIT_HMAC_SECRET: process.env.SUBMISSION_RATE_LIMIT_HMAC_SECRET || undefined,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || undefined,
  });
  if (!parsed.success) {
    throw new Error(`서버 환경 변수 설정이 올바르지 않습니다: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
