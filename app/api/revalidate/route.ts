import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRevalidateSecret } from "@/lib/env.server";
import { revalidatePublicEventsInBackground } from "@/features/events/cache";
import { slugSchema } from "@/lib/slug";

const requestSchema = z.object({ slug: slugSchema.optional() });

/** 비밀값 비교에 걸린 시간으로 값을 추측하지 못하게 길이와 상관없이 같은 방식으로 비교한다. */
function isAuthorized(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** 외부 수집기가 행사를 바꾼 뒤 공개 캐시를 무효화할 때 부른다. */
export async function POST(request: Request) {
  const secret = getRevalidateSecret();
  if (!secret) return NextResponse.json({ error: "REVALIDATE_SECRET가 설정되지 않았습니다." }, { status: 503 });
  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }
  // 본문이 없으면 목록 캐시만 무효화한다. 본문이 있는데 JSON이 아니면 수집기 쪽 버그이므로 성공으로 숨기지 않는다.
  const rawBody = await request.text();
  let body: unknown = {};
  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
    }
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "요청 본문을 확인하세요." }, { status: 400 });

  revalidatePublicEventsInBackground(parsed.data.slug);
  return NextResponse.json({ revalidated: true, slug: parsed.data.slug ?? null, at: new Date().toISOString() });
}
