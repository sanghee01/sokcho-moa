import { getAllPublicEvents } from "@/features/events/queries";
import { buildEventsRssXml } from "@/features/events/rss";
import { getPublicEnv } from "@/lib/env";

// sitemap처럼 정적으로 만들고 다시 만든다. 안에서 쓰는 공개 행사 캐시(5분)와 관리자 저장 때의 revalidatePath(features/events/cache.ts)를 따른다.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const events = await getAllPublicEvents();
  return new Response(buildEventsRssXml(events, getPublicEnv().NEXT_PUBLIC_SITE_URL), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
