const EVENT_ID_QUERY_KEYS = ["fstvlcntntsid", "eventseq", "articleseq", "pseq"];
const OFFICIAL_IMAGE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const SOKCHO_HOSTS = new Set(["sokcho.go.kr", "www.sokcho.go.kr"]);
const SOKCHO_FACILITIES_HOSTS = new Set(["sokchosiseol.or.kr", "www.sokchosiseol.or.kr"]);
const SOKCHO_LIBRARY_HOST = "library.sokcho.go.kr";
const MCST_HOSTS = new Set(["mcst.go.kr", "www.mcst.go.kr"]);
const UNAVAILABLE_OFFICIAL_HOSTS = new Set(["sokchocf.or.kr", "www.sokchocf.or.kr"]);

const SOKCHO_ARTICLE_PATHS = new Set([
  "/ct/museum/archives/notice/news",
  "/sc/portal/sokchonews/notice",
  "/sc/portal/sokchonews/pressrelease",
]);

const GENERIC_LAST_PATH_SEGMENT = /^(?:(?:[a-z0-9_-]*list)|boards|events|home|index|notices|programs)(?:\.[a-z0-9]+)?$/i;
const AUTH_PATH_SEGMENT = /^(?:auth|login|sign-?in)(?:\.[a-z0-9]+)?$/i;

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

export function isKnownUnavailableOfficialUrl(value: string | null) {
  if (!value) return false;
  try {
    return UNAVAILABLE_OFFICIAL_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return true;
  }
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

function queryValues(url: URL, key: string) {
  return [...url.searchParams.entries()]
    .filter(([candidate]) => candidate.toLowerCase() === key.toLowerCase())
    .map(([, value]) => value.trim());
}

function hasQueryValue(url: URL, key: string) {
  return queryValues(url, key).some(Boolean);
}

function isSokchoDetailUrl(url: URL, path: string) {
  if (path.toLowerCase() === "/sc/event/program") return hasQueryValue(url, "eventSeq");
  if (SOKCHO_ARTICLE_PATHS.has(path.toLowerCase())) return hasQueryValue(url, "articleSeq");

  return /^\/(?:sc\/)?upload\/popupzone\/(?:.+\/)?[^/]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(path);
}

function isSokchoFacilitiesDetailUrl(url: URL, path: string) {
  if (path.toLowerCase() !== "/bbs/event.do") return false;
  const modes = queryValues(url, "bmode");
  return modes.length > 0
    && modes.every((mode) => mode.toLowerCase() === "view")
    && hasQueryValue(url, "articleseq");
}

function isSokchoLibraryDetailUrl(path: string) {
  return /\/(?:post|movie)\/[^/]+$/i.test(path);
}

function isMcstDetailUrl(url: URL, path: string) {
  return path.toLowerCase() === "/site/s_culture/festival/festivalview.jsp"
    && hasQueryValue(url, "pSeq");
}

function hasAuthenticationPath(path: string) {
  const segments = path.split("/").filter(Boolean);
  return segments.some((segment) => AUTH_PATH_SEGMENT.test(segment));
}

function isGenericPath(path: string) {
  const segments = path.split("/").filter(Boolean);
  return segments.length === 0 || GENERIC_LAST_PATH_SEGMENT.test(segments.at(-1) ?? "");
}

export function isLikelyEventDetailUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;

    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
    if (hasAuthenticationPath(path)) return false;

    const hostname = url.hostname.toLowerCase();
    if (SOKCHO_HOSTS.has(hostname)) return isSokchoDetailUrl(url, path);
    if (SOKCHO_FACILITIES_HOSTS.has(hostname)) return isSokchoFacilitiesDetailUrl(url, path);
    if (hostname === SOKCHO_LIBRARY_HOST) return isSokchoLibraryDetailUrl(path);
    if (MCST_HOSTS.has(hostname)) return isMcstDetailUrl(url, path);

    if (isGenericPath(path)) return false;

    if (extractSourceExternalId(value)) return true;

    if (path === "/") return false;
    if (KNOWN_GENERIC_PATHS.has(path.toLowerCase())) return false;

    return true;
  } catch {
    return false;
  }
}
