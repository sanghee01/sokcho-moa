"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { addRecentSearch } from "@/components/layout/recent-search-storage";
import { SiteSearchForm } from "@/components/layout/site-search-form";
import { iconProps } from "@/components/ui/icon";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * 통합 검색 화면의 입력창(.ai/DESIGN.md 통합 검색). 들어오자마자 커서가 들어가 있어 바로 입력할 수 있다(NN/g Magnifying-Glass Icon).
 * GET 폼이라 검색어가 주소(?q=)에 남아 뒤로 가기·공유가 되고, 다시 검색하면 결과를 기다리는 동안 돋보기가 스피너로 바뀐다(site-search-form.tsx). 고른 범위(?type=)는 새로 검색해도 유지한다.
 * 결과 화면(검색어 있음)에서는 커서를 넣지 않는다. 모바일에서 키보드가 결과를 가리기 때문이다.
 * 주소의 검색어는 최근 검색어에 남긴다. 헤더 검색창·최근 검색어 링크로 와도 같은 곳에서 기록된다.
 */
export function SiteSearchField({ query, type }: { query: string; type: string | null }) {
  const [value, setValue] = useState(query);
  const [renderedQuery, setRenderedQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // 최근 검색어 링크처럼 같은 화면에서 주소만 바뀌면 입력값도 새 검색어로 맞춘다.
  if (query !== renderedQuery) {
    setRenderedQuery(query);
    setValue(query);
  }

  useEffect(() => {
    addRecentSearch(query);
  }, [query]);

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
  }

  // 제출하는 순간에도 남긴다. 결과 화면의 effect만 믿으면, 결과 화면이 다 뜨기 전에 다른 곳으로 가면 기록이 빠졌다(2026-11-21 E2E에서 발견).
  function handleSubmitQuery(submittedQuery: string) {
    addRecentSearch(submittedQuery);
  }

  return (
    <SiteSearchForm onSubmitQuery={handleSubmitQuery} className="relative">
      {type !== null && <input type="hidden" name="type" value={type} />}
      <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-content-subtle">
        <Search {...iconProps} className="group-aria-busy:hidden" />
        <LoadingSpinner className="hidden size-5 group-aria-busy:block" />
      </span>
      <input
        ref={inputRef}
        // type="search"는 브라우저마다 다른 지우기 단추를 붙여 직접 만든 지우기 버튼과 겹친다.
        type="text"
        inputMode="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus={query === ""}
        enterKeyHint="search"
        maxLength={100}
        aria-label="행사, 장소 검색"
        placeholder="행사, 장소 검색"
        className="h-12 w-full rounded-full border border-line-input bg-surface pl-12 pr-12 text-body text-content-strong placeholder:text-content-placeholder"
      />
      {value !== "" && (
        <button type="button" onClick={handleClear} aria-label="검색어 지우기" className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-content-subtle hover:bg-surface-subtle">
          <X {...iconProps} size={18} />
        </button>
      )}
    </SiteSearchForm>
  );
}
