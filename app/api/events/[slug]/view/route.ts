import { NextResponse } from "next/server";
import { slugSchema } from "@/lib/slug";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) return NextResponse.json({ error: "행사 주소를 확인하세요." }, { status: 400 });

  const client = createPublicSupabaseClient();

  const { data: viewCount, error } = await client.rpc("increment_event_view", { p_slug: slug });
  if (error) {
    // 상세 화면은 응답을 기다리지 않으므로 사용자에게는 영향이 없다. 장애를 알아챌 수 있게 서버 로그에만 남긴다.
    console.error("Event view increment failed", error.message);
    return NextResponse.json({ error: "조회수를 기록하지 못했습니다." }, { status: 500 });
  }
  // RPC는 slug에 해당하는 공개 행사가 없으면 null을 돌려준다.
  if (viewCount == null) return NextResponse.json({ error: "공개된 행사를 찾을 수 없습니다." }, { status: 404 });

  // 조회수는 공개 행사 목록의 기존 최대 5분 캐시 주기에 따라 반영한다.
  return new NextResponse(null, { status: 204 });
}
