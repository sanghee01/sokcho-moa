import { getPublicEnv } from "@/lib/config/env";
import { eventCategories, type EventCategory } from "@/lib/domain/event";
import { eventTopicPath } from "@/lib/domain/event-topic";

export const INDEXNOW_KEY = "4d8f5c2e1a7b4c9d8e6f0a3b5c7d9e12";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

const INDEXNOW_ENDPOINT = "https://searchadvisor.naver.com/indexnow";

export function buildPublicEventIndexPaths(
  slug: string,
  categories: readonly unknown[] = [],
) {
  const paths = ["/", `/events/${slug}`];
  for (const category of categories) {
    if (typeof category === "string" && eventCategories.includes(category as EventCategory)) {
      paths.push(eventTopicPath(category as EventCategory));
    }
  }
  return Array.from(new Set(paths));
}

export function buildIndexNowPayload(paths: readonly string[], siteUrl: string) {
  const homeUrl = new URL("/", siteUrl);
  const urlList = paths
    .map((path) => new URL(path, homeUrl))
    .filter((url) => url.origin === homeUrl.origin)
    .map((url) => url.toString());

  return {
    host: homeUrl.host,
    key: INDEXNOW_KEY,
    keyLocation: new URL(INDEXNOW_KEY_PATH, homeUrl).toString(),
    urlList: Array.from(new Set(urlList)),
  };
}

export async function notifyIndexNow(paths: readonly string[]) {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const homeUrl = new URL("/", siteUrl);
  if (homeUrl.hostname === "localhost" || homeUrl.hostname === "127.0.0.1") return false;

  const payload = buildIndexNowPayload(paths, siteUrl);
  if (payload.urlList.length === 0) return false;

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status !== 200 && response.status !== 202) {
      console.warn("IndexNow 갱신 요청을 처리하지 못했습니다.", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("IndexNow 갱신 요청 중 네트워크 오류가 발생했습니다.", error);
    return false;
  }
}
