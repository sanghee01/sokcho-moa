"use client";

import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { iconProps } from "@/components/ui/icon";

/**
 * 통합 검색 화면의 입력창(.ai/DESIGN.md 통합 검색). 들어오자마자 커서가 들어가 있어 바로 입력할 수 있다(NN/g Magnifying-Glass Icon).
 * 일반 GET 폼이라 검색어가 주소(?q=)에 남아 뒤로 가기·공유가 된다. 고른 범위(?type=)는 새로 검색해도 유지한다.
 */
export function SiteSearchField({ query, type }: { query: string; type: string | null }) {
  const [value, setValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <form action="/search" role="search" aria-label="사이트 검색" className="relative">
      {type !== null && <input type="hidden" name="type" value={type} />}
      <Search {...iconProps} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle" />
      <input
        ref={inputRef}
        // type="search"는 브라우저마다 다른 지우기 단추를 붙여 직접 만든 지우기 버튼과 겹친다.
        type="text"
        inputMode="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus
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
    </form>
  );
}
