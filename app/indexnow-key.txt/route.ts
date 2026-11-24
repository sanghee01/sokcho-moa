import { INDEXNOW_KEY } from "@/lib/seo/indexnow";

// 고정된 키만 돌려주는 GET이라 cacheComponents에서 저절로 미리 만들어진다. 예전의 dynamic = "force-static"은 쓸 수 없어 지웠다(2026-11-24).

export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "cache-control": "public, max-age=86400, immutable",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
