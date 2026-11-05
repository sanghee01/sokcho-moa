import { revalidatePath, updateTag } from "next/cache";

export const PUBLIC_PLACES_CACHE_TAG = "public-places";

/**
 * 관리자가 명소를 바꾼 직후 호출한다(server action 전용).
 * updateTag는 캐시를 즉시 만료시켜, 저장한 사람이 다음 화면에서 이전 값을 보지 않게 한다.
 */
export function expirePublicPlaces() {
  updateTag(PUBLIC_PLACES_CACHE_TAG);
  revalidatePath("/admin");
}
