import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { calendarRedirectHref, legacyEventSearchHref } from "@/features/events/model/browse-url";
import { eventMonthPath, getCurrentEventMonth } from "@/features/events/model/event-month";
import { findEventTopicBySlug } from "@/features/events/model/topics";
import { searchParamsToRecord } from "@/lib/search-params";

function notFoundResponse(request: NextRequest) {
  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = "/_not-found";
  return NextResponse.rewrite(notFoundUrl, { status: 404 });
}

function redirectResponse(request: NextRequest, href: string, status: 307 | 308) {
  return NextResponse.redirect(new URL(href, request.url), status);
}

/**
 * 그리기 전에 보낼 리다이렉트. 없으면 null. 문서 요청뿐 아니라 사이트 안 이동의 데이터 요청(RSC)도 여기서 보낸다.
 * 봇·북마크가 언제나 진짜 상태 코드를 받게 요청 종류로 나누지 않는다. 페이지에도 같은 redirect가 있지만 matcher가 빠졌을 때의 안전장치다(2026-11-24 리뷰).
 */
function findRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/months") return redirectResponse(request, eventMonthPath(getCurrentEventMonth()), 307);
  if (pathname === "/calendar") return redirectResponse(request, calendarRedirectHref(searchParamsToRecord(searchParams)), 307);
  if (pathname === "/" || pathname.startsWith("/topics/")) {
    const href = legacyEventSearchHref(searchParamsToRecord(searchParams));
    if (href !== null) return redirectResponse(request, href, 308);
  }
  return null;
}

/**
 * 렌더링 전에 처리해야 하는 일만 둔다. 관리자 권한은 여기서 판단하지 않고 각 페이지·action이 확인한다
 * (proxy matcher가 바뀌면 보호가 조용히 빠질 수 있기 때문).
 *
 * cacheComponents(2026-11-24)에서는 요청마다 그리는 페이지도 미리 만든 틀에 이어 그리는 방식이라, 페이지 안의
 * redirect()·notFound()는 이미 보낸 200 상태 코드를 바꾸지 못하고 브라우저 이동·화면 안내만 된다. 검색엔진과 예전 북마크에
 * 진짜 상태 코드가 가야 하는 것을 여기서 먼저 처리한다.
 *
 * 1. 없는 토픽은 진짜 HTTP 404로 응답한다. 처음에는 토픽 페이지가 loading.tsx로 스트리밍되어 넣었고, loading.tsx를 지운 뒤(2026-11-15)에는
 *    필요 없어졌다가 위 이유로 다시 필요해졌다.
 * 2. /months(요청한 때의 이번 달), /calendar(삭제한 캘린더 북마크), 예전 검색 주소 /?q=·/topics/…?q=(통합 검색)를 307·308로 보낸다.
 * 3. 관리자 화면(/admin) 요청에서만 Supabase 로그인 세션을 갱신한다. 공개 페이지는 세션이 필요 없다.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const topicMatch = pathname.match(/^\/topics\/([^/]+)$/);
  if (topicMatch && !findEventTopicBySlug(topicMatch[1])) return notFoundResponse(request);

  const redirect = findRedirect(request);
  if (redirect !== null) return redirect;

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
  matcher: [
    // 홈은 예전 검색 주소(?q=)일 때만 거친다. 가장 많이 들어오는 홈의 일반 방문·데이터 요청까지 proxy를 돌리지 않는다(2026-11-24).
    { source: "/", has: [{ type: "query", key: "q" }] },
    "/months",
    "/calendar",
    "/admin/:path*",
    "/topics/:path*",
  ],
};
