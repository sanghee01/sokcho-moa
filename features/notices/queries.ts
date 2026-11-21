import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { PUBLIC_NOTICES_CACHE_TAG } from "@/features/notices/cache";
import { mapNoticeRow } from "@/features/notices/mappers";
import { selectBannerNotice, type Notice } from "@/features/notices/model/notice";

const getCachedPublicNotices = unstable_cache(async (): Promise<Notice[]> => {
  const client = createPublicSupabaseClient();
  const { data, error } = await client
    .from("notices")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`공지를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []).map(mapNoticeRow).filter((notice) => notice !== null);
}, ["published-notices"], { revalidate: 300, tags: [PUBLIC_NOTICES_CACHE_TAG] });

/** 공개한 공지 전체, 최근 글부터. 글 수가 적어 목록 하나만 캐시하고 배너 선택은 model 함수로 한다. */
export async function getPublicNotices(): Promise<Notice[]> {
  return getCachedPublicNotices();
}

/**
 * 지금 알릴 공지 하나(공지 띠와 목록 배너의 공지 장이 함께 쓴다). 없으면 null.
 * 알림은 모든 페이지의 공통 틀에 있다. 공지를 못 불러와도 페이지는 떠야 하므로 오류는 기록만 하고 알림을 뺀다.
 */
export async function getBannerNotice(): Promise<Notice | null> {
  try {
    return selectBannerNotice(await getPublicNotices());
  } catch (error) {
    console.error("Notice banner load failed", error);
    return null;
  }
}
