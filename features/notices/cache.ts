import { revalidatePath, updateTag } from "next/cache";

export const PUBLIC_NOTICES_CACHE_TAG = "public-notices";

/**
 * 관리자가 공지를 바꾼 직후 호출한다(server action 전용).
 * 상단 배너가 모든 페이지의 공통 틀에 있으므로, 미리 만들어 둔 페이지 전체를 다시 만들게 한다.
 */
export function expirePublicNotices() {
  updateTag(PUBLIC_NOTICES_CACHE_TAG);
  revalidatePath("/", "layout");
}
