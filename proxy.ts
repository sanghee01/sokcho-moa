import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { findEventTopicBySlug } from "@/features/events/model/topics";

function notFoundResponse(request: NextRequest) {
  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = "/_not-found";
  return NextResponse.rewrite(notFoundUrl, { status: 404 });
}

/**
 * 렌더링 전에 처리해야 하는 일만 둔다. 관리자 권한은 여기서 판단하지 않고 각 페이지·action이 확인한다
 * (proxy matcher가 바뀌면 보호가 조용히 빠질 수 있기 때문).
 *
 * 1. 없는 토픽은 진짜 HTTP 404로 응답한다. 토픽 페이지는 loading.tsx로 스트리밍되어,
 *    페이지 안의 notFound()로는 이미 보낸 200 상태 코드를 바꿀 수 없다.
 * 2. 관리자 화면(/admin) 요청에서만 Supabase 로그인 세션을 갱신한다. 공개 페이지는 세션이 필요 없다.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const topicMatch = pathname.match(/^\/topics\/([^/]+)$/);
  if (topicMatch && !findEventTopicBySlug(topicMatch[1])) return notFoundResponse(request);

  if (!pathname.startsWith("/admin")) return NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        // 세션 쿠키가 담긴 응답을 CDN이 캐시해 다른 사람에게 주지 않도록 Supabase가 주는 캐시 헤더를 그대로 붙인다.
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  await client.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/topics/:path*"],
};
