import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  RECENT_SEARCH_LIMIT,
  RECENT_SEARCH_STORAGE_KEY,
  removeRecentSearch,
} from "@/components/layout/recent-search-storage";

// unit test는 node 환경이라 브라우저 저장소를 Map으로 흉내 낸다.
function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

describe("최근 검색어 저장", () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("처음에는 비어 있고, 검색어를 앞뒤 공백 없이 최신 순으로 쌓는다", () => {
    expect(getRecentSearches()).toEqual([]);
    addRecentSearch("  불꽃축제 ");
    addRecentSearch("워터파크");
    expect(getRecentSearches()).toEqual(["워터파크", "불꽃축제"]);
  });

  it("빈 검색어는 남기지 않는다", () => {
    addRecentSearch("   ");
    expect(getRecentSearches()).toEqual([]);
  });

  it("같은 검색어를 다시 찾으면 하나만 남기고 맨 앞으로 옮긴다", () => {
    addRecentSearch("불꽃축제");
    addRecentSearch("워터파크");
    addRecentSearch("불꽃축제");
    expect(getRecentSearches()).toEqual(["불꽃축제", "워터파크"]);
  });

  it(`${RECENT_SEARCH_LIMIT}개를 넘으면 오래된 것부터 지운다`, () => {
    for (let index = 1; index <= RECENT_SEARCH_LIMIT + 2; index += 1) addRecentSearch(`검색어 ${index}`);
    const searches = getRecentSearches();
    expect(searches).toHaveLength(RECENT_SEARCH_LIMIT);
    expect(searches[0]).toBe(`검색어 ${RECENT_SEARCH_LIMIT + 2}`);
    expect(searches).not.toContain("검색어 1");
  });

  it("하나씩 지우거나 모두 지운다", () => {
    addRecentSearch("불꽃축제");
    addRecentSearch("워터파크");
    removeRecentSearch("불꽃축제");
    expect(getRecentSearches()).toEqual(["워터파크"]);
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
    expect(storage.getItem(RECENT_SEARCH_STORAGE_KEY)).toBeNull();
  });

  it("저장된 값이 깨져 있으면 기록 없음으로 본다", () => {
    storage.setItem(RECENT_SEARCH_STORAGE_KEY, "{not json");
    expect(getRecentSearches()).toEqual([]);
    storage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify([1, 2]));
    expect(getRecentSearches()).toEqual([]);
  });
});
