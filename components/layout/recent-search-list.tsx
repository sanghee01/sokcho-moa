"use client";

import { Clock, X } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { clearRecentSearches, getRecentSearches, getRecentSearchesOnServer, removeRecentSearch, subscribeRecentSearches } from "@/components/layout/recent-search-storage";
import { iconProps } from "@/components/ui/icon";

/**
 * 검색어 없이 검색 화면을 열었을 때 보이는 최근 검색어(.ai/DESIGN.md 통합 검색). 처음에는 "최근 검색 내역이 없어요"만 보이고,
 * 검색하면 그 검색어가 맨 위에 쌓인다(2026-11-21 사용자 결정: 인기 행사 추천 대신 야놀자처럼 기록을 보인다).
 * 줄마다 검색어 링크와 삭제 버튼을 나란히 둬 칩 안에 작은 X를 넣는 것보다 누를 곳이 넓다.
 */
export function RecentSearchList() {
  const searches = useSyncExternalStore(subscribeRecentSearches, getRecentSearches, getRecentSearchesOnServer);

  return (
    <section aria-labelledby="recent-search-title" className="mt-8">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 id="recent-search-title" className="text-title-3 text-content-strong">최근 검색어</h2>
        {Boolean(searches !== null && searches.length > 0) && (
          <button type="button" onClick={clearRecentSearches} className="inline-flex min-h-11 items-center px-2 text-label font-medium text-content-muted hover:text-content-strong">
            전체 삭제
          </button>
        )}
      </div>
      {searches !== null && searches.length === 0 && (
        <p className="py-16 text-center text-body text-content-muted">최근 검색 내역이 없어요.</p>
      )}
      {searches !== null && searches.length > 0 && (
        <ul className="mt-1">
          {searches.map((term) => (
            <li key={term} className="flex items-center gap-2">
              <Link href={`/search?${new URLSearchParams({ q: term }).toString()}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-body text-content hover:text-content-strong">
                <Clock {...iconProps} size={18} className="shrink-0 text-content-subtle" />
                <span className="truncate">{term}</span>
              </Link>
              <button type="button" onClick={() => removeRecentSearch(term)} aria-label={`최근 검색어 ${term} 삭제`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-content-subtle hover:bg-surface-subtle">
                <X {...iconProps} size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
