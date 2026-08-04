import { INDEXNOW_KEY } from "@/lib/seo/indexnow";

export const dynamic = "force-static";

export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "cache-control": "public, max-age=86400, immutable",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
