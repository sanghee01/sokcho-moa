const EVENT_ID_QUERY_KEYS = ["fstvlcntntsid", "eventseq", "articleseq", "pseq"];
const OFFICIAL_IMAGE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)$/i;

const KNOWN_GENERIC_PATHS = new Set([
  "/sc/portal",
  "/sc/event",
  "/ct/culture/events",
  "/sc/portal/sokchonews/notification",
  "/bbs/event.do",
]);

export function normalizeComparableUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
    url.searchParams.sort();
    return url.toString();
  } catch {
    return null;
  }
}

export function isSameSourceUrl(left: string | null, right: string | null) {
  const normalizedLeft = normalizeComparableUrl(left);
  const normalizedRight = normalizeComparableUrl(right);
  return normalizedLeft != null && normalizedLeft === normalizedRight;
}

export function extractSourceExternalId(value: string) {
  try {
    const url = new URL(value);
    for (const [key, id] of url.searchParams.entries()) {
      if (EVENT_ID_QUERY_KEYS.includes(key.toLowerCase()) && id.trim()) return id.trim();
    }

    const pathId = url.pathname.match(/\/(?:post|movie)\/([^/]+)\/?$/i)?.[1];
    if (pathId) return decodeURIComponent(pathId);

    if (OFFICIAL_IMAGE_PATTERN.test(url.pathname)) {
      return decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "") || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isLikelyEventDetailUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (extractSourceExternalId(value)) return true;

    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
    if (path === "/") return false;
    if (KNOWN_GENERIC_PATHS.has(path.toLowerCase())) return false;

    return true;
  } catch {
    return false;
  }
}
