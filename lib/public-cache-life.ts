/**
 * "지금 시각"으로 그리는 공개 화면을 `"use cache"`로 저장해 둘 기간(초). cacheLife()에 그대로 넘긴다.
 * cacheComponents에서는 미리 만드는 화면이 new Date()를 쓰려면 저장할 기간을 정해야 한다(2026-11-24).
 * 5분은 공개 조회 캐시(features/<도메인>/queries.ts의 unstable_cache, 300초)와 같아, 전환 전 페이지가 다시 만들어지던 주기를 그대로 둔다.
 * expire는 정하지 않아 기본값(없음)을 따른다. 전처럼 오래 방문이 없어도 이전 화면을 먼저 보여 주고 뒤에서 새로 만든다.
 */
export const PUBLIC_PAGE_CACHE_LIFE = { stale: 300, revalidate: 300 };
