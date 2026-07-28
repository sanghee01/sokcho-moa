import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { findEventTopicBySlug } from "@/lib/domain/event-topic";

export async function proxy(request: NextRequest) {
  const topicMatch = request.nextUrl.pathname.match(/^\/topics\/([^/]+)$/);
  if (topicMatch && !findEventTopicBySlug(topicMatch[1])) {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = "/_not-found";
    return NextResponse.rewrite(notFoundUrl, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || process.env.NEXT_PUBLIC_DATA_MODE !== "supabase") return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  await client.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/topics/:path*"],
};
