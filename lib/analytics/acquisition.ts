/**
 * 유입 경로 측정(2026-11-17). 공유 링크·카카오톡처럼 출처(referrer)가 안 넘어오는 방문은 GA가 모두 Direct로 묶는다.
 * 그래서 우리가 만드는 링크에는 utm 꼬리표를 붙이고, 앱 안 브라우저는 사용자 에이전트로 알아봐 따로 표시한다.
 * 설계와 GA 관리자 설정은 docs/analytics-events.md의 "유입 경로"에 있다.
 */

// medium을 GA 기본 채널 규칙의 social로 두어 공유 유입이 Unassigned가 아니라 Organic Social로 묶이게 한다.
const SHARE_CAMPAIGN_PARAMS = { utm_source: "share", utm_medium: "social" };

/** 홈 화면에 추가한 앱으로 연 방문. 북마크·주소 입력과 구분하려고 manifest의 start_url에 붙인다. */
export const HOME_SCREEN_START_URL = "/?utm_source=homescreen&utm_medium=app";

const CAMPAIGN_PARAM_PREFIX = "utm_";

/** 공유 버튼이 건네는 주소. 원래 주소의 쿼리·해시는 버리고 공유 꼬리표만 붙인다. */
export function toShareUrl(path: string, origin: string) {
  const url = new URL(path, origin);
  url.search = new URLSearchParams(SHARE_CAMPAIGN_PARAMS).toString();
  url.hash = "";
  return url.toString();
}

/**
 * 주소에서 utm 꼬리표만 뺀 주소. 뺄 것이 없으면 null.
 * GA가 첫 page_view로 꼬리표를 읽은 뒤 주소창을 정리할 때 쓴다. 방문자가 이 주소를 다시 공유해도 꼬리표가 따라가지 않는다.
 */
export function removeCampaignParams(href: string) {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const campaignKeys = [...url.searchParams.keys()].filter((key) => key.startsWith(CAMPAIGN_PARAM_PREFIX));
  if (campaignKeys.length === 0) return null;
  for (const key of campaignKeys) url.searchParams.delete(key);
  return url.toString();
}

export type InAppBrowser = "kakaotalk" | "naver" | "daum" | "instagram" | "facebook" | "line" | "band";

// 앱마다 사용자 에이전트 끝에 붙이는 표시. 인스타그램은 페이스북 표시를 함께 달 때가 있어 먼저 본다.
const IN_APP_BROWSER_PATTERNS: ReadonlyArray<readonly [InAppBrowser, RegExp]> = [
  ["kakaotalk", /KAKAOTALK/i],
  ["naver", /NAVER\(inapp/i],
  ["daum", /DaumApps/i],
  ["instagram", /Instagram/i],
  ["facebook", /FBAN|FBAV|FB_IAB/],
  ["line", /\bLine\//],
  ["band", /\bBAND\//],
];

export function detectInAppBrowser(userAgent: string): InAppBrowser | null {
  return IN_APP_BROWSER_PATTERNS.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? null;
}

/**
 * 앱 안 브라우저면 그 뒤 모든 GA 이벤트에 in_app_browser를 붙인다. 첫 page_view보다 먼저 불러야 방문 첫 화면에도 붙는다.
 * Direct로 잡힌 방문 중 카카오톡에서 연 링크를 북마크·주소 입력과 구분할 수 있다.
 */
export function markInAppBrowser(userAgent: string) {
  const inAppBrowser = detectInAppBrowser(userAgent);
  if (inAppBrowser === null) return;
  window.gtag?.("set", { in_app_browser: inAppBrowser });
}
