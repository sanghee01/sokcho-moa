import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { eventCategories, type EventCategory } from "@/features/events/model/taxonomy";
import { eventTopicPath, eventTopics } from "@/features/events/model/topics";

/** 공개 행사 목록 캐시의 tag. 조회(queries.ts)와 무효화(이 파일)가 같은 이름을 쓴다. */
export const PUBLIC_EVENTS_CACHE_TAG = "public-events";

/** 행사가 바뀌면 다시 만들어야 하는 공개 경로. 무효화 경로의 원본은 이 함수 하나다. */
function publicEventPaths(slug?: string | null) {
  const paths = ["/", "/sitemap.xml", ...eventTopics.map((topic) => topic.path)];
  if (slug) paths.push(`/events/${slug}`);
  return paths;
}

/**
 * 관리자 action에서 행사를 바꾼 직후 호출한다.
 * updateTag는 캐시를 즉시 만료시킨다. revalidateTag(…, "max")는 다음 요청에 이전 값을 먼저 보여 주므로,
 * 저장한 관리자가 공개 화면에서 바뀌기 전 내용을 볼 수 있었다.
 */
export function expirePublicEvents(slug?: string | null) {
  updateTag(PUBLIC_EVENTS_CACHE_TAG);
  for (const path of publicEventPaths(slug)) revalidatePath(path);
  revalidatePath("/admin");
}

/**
 * 외부 수집기가 /api/revalidate로 알릴 때 호출한다. route handler에서는 updateTag를 쓸 수 없어,
 * 다음 요청에서 백그라운드로 새로 만드는 revalidateTag(…, "max")를 쓴다.
 */
export function revalidatePublicEventsInBackground(slug?: string | null) {
  revalidateTag(PUBLIC_EVENTS_CACHE_TAG, "max");
  for (const path of publicEventPaths(slug)) revalidatePath(path);
}

/** IndexNow로 검색엔진에 알릴 경로: 홈, 행사 상세, 그 행사가 속한 토픽 페이지. */
export function eventIndexNowPaths(slug: string, categories: readonly unknown[] = []) {
  const paths = ["/", `/events/${slug}`];
  for (const category of categories) {
    if (typeof category === "string" && eventCategories.includes(category as EventCategory)) {
      paths.push(eventTopicPath(category as EventCategory));
    }
  }
  return Array.from(new Set(paths));
}
