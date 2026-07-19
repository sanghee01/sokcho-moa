import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional() });

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "REVALIDATE_SECRET가 설정되지 않았습니다." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "요청 본문을 확인하세요." }, { status: 400 });
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (parsed.data.slug) revalidatePath(`/events/${parsed.data.slug}`);
  return NextResponse.json({ revalidated: true, slug: parsed.data.slug ?? null, at: new Date().toISOString() });
}
