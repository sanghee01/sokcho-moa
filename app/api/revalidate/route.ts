import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env.server";
import { revalidatePublicEventsInBackground } from "@/features/events/cache";

const requestSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional() });

/** 비밀값 비교에 걸린 시간으로 값을 추측하지 못하게 길이와 상관없이 같은 방식으로 비교한다. */
function isAuthorized(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** 외부 수집기가 행사를 바꾼 뒤 공개 캐시를 무효화할 때 부른다. */
export async function POST(request: Request) {
  const secret = getServerEnv().REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "REVALIDATE_SECRET가 설정되지 않았습니다." }, { status: 503 });
  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "요청 본문을 확인하세요." }, { status: 400 });

  revalidatePublicEventsInBackground(parsed.data.slug);
  return NextResponse.json({ revalidated: true, slug: parsed.data.slug ?? null, at: new Date().toISOString() });
}
