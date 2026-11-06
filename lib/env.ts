import { z } from "zod";

// 브라우저에도 노출되는 공개 환경 변수. NEXT_PUBLIC_ 값은 빌드할 때 코드에 그대로 박힌다.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * canonical·sitemap·JSON-LD·IndexNow에 쓰는 사이트 주소.
 * 설정값이 없으면 Vercel 시스템 변수로 실제 배포 주소를 쓰고, Vercel 밖(로컬)에서만 localhost를 쓴다.
 * (예전에는 운영에서 값이 빠지면 조용히 localhost가 되어 검색엔진에 localhost 주소가 나갔다.)
 */
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: resolveSiteUrl(),
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `공개 환경 변수 설정이 올바르지 않습니다. 로컬은 \`pnpm db:start\` 후 .env.example을 참고하세요: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}
