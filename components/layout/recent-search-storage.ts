import { z } from "zod";

// 최근 검색어는 이 기기의 localStorage에만 둔다. 서버로 보내지 않고, 저장이 막힌 브라우저(사생활 보호 창 등)에서는 기록 없이 동작한다.
export const RECENT_SEARCH_STORAGE_KEY = "sokcho-moa:recent-searches";
export const RECENT_SEARCH_LIMIT = 10;

const storedSearchesSchema = z.array(z.string().trim().min(1).max(100)).catch([]);
const listeners = new Set<() => void>();
const EMPTY_SEARCHES: readonly string[] = [];
let cachedRaw: string | null = null;
let cachedSearches: readonly string[] = EMPTY_SEARCHES;

function readRaw() {
  try {
    return window.localStorage.getItem(RECENT_SEARCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseSearches(raw: string | null): readonly string[] {
  if (raw === null) return EMPTY_SEARCHES;
  try {
    return storedSearchesSchema.parse(JSON.parse(raw)).slice(0, RECENT_SEARCH_LIMIT);
  } catch {
    return EMPTY_SEARCHES;
  }
}

/** 최근 검색어(최신 순). 저장 값이 같으면 같은 배열을 돌려줘야 useSyncExternalStore가 다시 그리지 않는다. */
export function getRecentSearches() {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSearches = parseSearches(raw);
  }
  return cachedSearches;
}

/** 서버 렌더에서는 기록을 알 수 없어 null을 돌려준다. 화면은 이때 "기록 없음"을 그리지 않고 비워 둔다(새로 고침 때 문구가 깜빡이지 않게). */
export function getRecentSearchesOnServer() {
  return null;
}

export function subscribeRecentSearches(listener: () => void) {
  listeners.add(listener);
  // 다른 탭에서 바꾼 기록도 반영한다.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeSearches(searches: readonly string[]) {
  try {
    if (searches.length === 0) window.localStorage.removeItem(RECENT_SEARCH_STORAGE_KEY);
    else window.localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(searches));
  } catch {
    return;
  }
  for (const listener of listeners) listener();
}

/** 같은 검색어는 맨 앞으로 옮기고, 오래된 것부터 RECENT_SEARCH_LIMIT개를 넘는 만큼 지운다. */
export function addRecentSearch(query: string) {
  const term = query.trim();
  if (term === "") return;
  const current = getRecentSearches();
  if (current[0] === term) return;
  writeSearches([term, ...current.filter((search) => search !== term)].slice(0, RECENT_SEARCH_LIMIT));
}

export function removeRecentSearch(term: string) {
  writeSearches(getRecentSearches().filter((search) => search !== term));
}

export function clearRecentSearches() {
  writeSearches([]);
}
