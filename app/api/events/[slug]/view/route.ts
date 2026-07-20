import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PUBLIC_EVENTS_CACHE_TAG } from "@/lib/data/cache-tags";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) return NextResponse.json({ error: "행사 주소를 확인하세요." }, { status: 400 });

  const client = createPublicSupabaseClient();
  if (!client) return new NextResponse(null, { status: 204 });

  const { error } = await client.rpc("increment_event_view", { p_slug: slug });
  if (error) return new NextResponse(null, { status: 204 });

  revalidateTag(PUBLIC_EVENTS_CACHE_TAG, "max");
  return new NextResponse(null, { status: 204 });
}
