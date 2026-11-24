import { getAllPublicEvents } from "@/features/events/queries";
import { buildEventsRssXml } from "@/features/events/rss";
import { getPublicEnv } from "@/lib/env";

// sitemap처럼 정적으로 만들고 다시 만든다. 안에서 쓰는 공개 행사 캐시(5분)와 관리자 저장 때의 revalidatePath(features/events/cache.ts)를 따른다.
// cacheComponents에서는 요청 값·지금 시각을 읽지 않는 GET이 저절로 미리 만들어져, 예전의 dynamic = "force-static"·revalidate를 지웠다(2026-11-24).

export async function GET() {
  const events = await getAllPublicEvents();
  return new Response(buildEventsRssXml(events, getPublicEnv().NEXT_PUBLIC_SITE_URL), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
