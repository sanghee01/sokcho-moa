import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_DATA_MODE: z.enum(["demo", "supabase"]).default("demo"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE || "demo",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || undefined,
  });
  if (!parsed.success) {
    throw new Error(`환경 변수 설정이 올바르지 않습니다: ${z.prettifyError(parsed.error)}`);
  }
  if (
    parsed.data.NEXT_PUBLIC_DATA_MODE === "supabase" &&
    (!parsed.data.NEXT_PUBLIC_SUPABASE_URL || !parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ) {
    throw new Error(
      "NEXT_PUBLIC_DATA_MODE=supabase일 때 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 필요합니다. .env.example을 확인하세요.",
    );
  }
  return parsed.data;
}
