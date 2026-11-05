import { z } from "zod";

// 브라우저에도 노출되는 공개 환경 변수. NEXT_PUBLIC_ 값은 빌드할 때 코드에 그대로 박힌다.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
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
