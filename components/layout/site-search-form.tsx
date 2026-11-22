"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type ReactNode } from "react";
import { buildSiteSearchHref, SEARCH_PATH } from "@/components/layout/site-search-href";

/**
 * 통합 검색 폼(헤더 검색창과 검색 화면 입력창이 함께 쓴다). 스크립트가 없으면 일반 GET 폼으로 /search?q=에 가고,
 * 있으면 페이지 전체를 다시 받지 않고 화면만 바꾼다. 결과를 기다리는 동안 aria-busy를 켜, 안쪽 돋보기가 스피너로 바뀐다
 * (group-aria-busy). 예전 목록 검색창과 같은 방식이다. 검색 화면은 크롤러가 읽을 페이지가 아니지만 공개 화면이라
 * loading.tsx 대신 이동 중 표시를 쓴다(.ai/DESIGN.md Skeleton, 2026-11-21 리뷰: 결과가 오기 전까지 아무 표시가 없었음).
 */
export function SiteSearchForm({
  className = "",
  children,
  onSubmitQuery,
}: {
  className?: string;
  children: ReactNode;
  /** 이동하기 직전에 다듬은 검색어로 부른다(최근 검색어 기록 등). */
  onSubmitQuery?: (query: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // 기다리는 중에 검색어를 고쳐 다시 제출해도 막지 않는다. 새 이동이 앞 이동을 대신한다(2026-11-22 리뷰: 느린 회선에서 다시 검색이 무시됐음).
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    const type = formData.get("type");
    onSubmitQuery?.(query);
    startTransition(() => router.push(buildSiteSearchHref(query, typeof type === "string" ? type : null)));
  }

  return (
    <form action={SEARCH_PATH} role="search" aria-label="사이트 검색" aria-busy={isPending} onSubmit={handleSubmit} className={`group ${className}`}>
      {children}
    </form>
  );
}
