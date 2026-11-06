import { NextResponse } from "next/server";
import { checkPublicSubmissionRateLimit } from "@/lib/rate-limit";
import { slugSchema } from "@/lib/slug";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * 행사 상세 조회수 +1. 조회수는 목록의 조회순 정렬에 쓰이므로 부풀리기를 막아야 한다.
 * 그래서 DB 함수는 서버(service_role)만 부를 수 있고, 여기서 방문자·행사별 요청 제한을 먼저 거친다.
 * 상세 화면은 응답을 기다리지 않으므로(fire-and-forget) 어떤 응답이든 화면에는 영향이 없다.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) return NextResponse.json({ error: "행사 주소를 확인하세요." }, { status: 400 });

  // 요청 제한을 확인하지 못하면(설정 누락·DB 장애) 조회수를 세지 않는다(fail closed). 원인은 요청 제한 모듈이 로그로 남긴다.
  const rateLimit = await checkPublicSubmissionRateLimit("event_view", { subject: slug });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "요청이 많습니다." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const client = createAdminSupabaseClient();
  if (!client) {
    console.error("Event view increment unavailable: SUPABASE_SECRET_KEY is not configured");
    return NextResponse.json({ error: "조회수를 기록할 수 없습니다." }, { status: 503 });
  }

  const { data: viewCount, error } = await client.rpc("increment_event_view", { p_slug: slug });
  if (error) {
    // 장애를 알아챌 수 있게 서버 로그에만 남긴다.
    console.error("Event view increment failed", error.message);
    return NextResponse.json({ error: "조회수를 기록하지 못했습니다." }, { status: 500 });
  }
  // RPC는 slug에 해당하는 공개 행사가 없으면(없는 행사·비공개·샘플 행사) null을 돌려준다.
  if (viewCount == null) return NextResponse.json({ error: "공개된 행사를 찾을 수 없습니다." }, { status: 404 });

  // 조회수는 공개 행사 목록의 기존 최대 5분 캐시 주기에 따라 반영한다.
  return new NextResponse(null, { status: 204 });
}
