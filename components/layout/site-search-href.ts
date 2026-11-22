// 통합 검색(/search) 주소. 헤더 검색창·검색 화면 입력창·검색 범위 칩이 같은 규칙으로 주소를 만든다.
// "use client" 파일은 상수·함수를 export하지 못해(루트 AGENTS.md) 여기에 둔다.
export const SEARCH_PATH = "/search";

/** 검색어(q)와 범위(type)를 담은 검색 주소. 검색어가 비면 검색 화면 첫 화면(최근 검색어)으로 간다. */
export function buildSiteSearchHref(query: string, type: string | null = null) {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  if (trimmed && type) params.set("type", type);
  const search = params.toString();
  return search ? `${SEARCH_PATH}?${search}` : SEARCH_PATH;
}
