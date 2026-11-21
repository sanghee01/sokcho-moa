import { ExternalLink, Megaphone, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { iconProps } from "@/components/ui/icon";
import { SITE_INQUIRY_URL } from "@/lib/seo/site-identity";

// 헤더 오른쪽의 검색·공지·문의(.ai/DESIGN.md 공통 헤더). 돋보기 말고는 아이콘만으로 뜻이 잘 전달되지 않아(NN/g Icon Usability)
// 모바일은 아이콘 아래에 작은 글자 라벨을 붙이고, md 이상은 열린 검색창과 글자 링크로 둔다(2026-11-21 사용자 결정).
export const SEARCH_PATH = "/search";

const mobileActionClassName = "flex size-11 flex-col items-center justify-center gap-0.5 rounded-control text-caption font-medium leading-none text-content-muted hover:bg-surface-subtle";

/** 모바일(md 미만) 헤더 아이콘. 검색은 검색 화면으로 가고, 그 화면에서 바로 입력할 수 있다. */
export function MobileHeaderActions() {
  return (
    <div className="flex items-center gap-1 md:hidden">
      <Link href={SEARCH_PATH} className={mobileActionClassName}>
        <Search {...iconProps} size={20} />검색
      </Link>
      <Link href="/notices" className={mobileActionClassName}>
        <Megaphone {...iconProps} size={20} />공지
      </Link>
      <a href={SITE_INQUIRY_URL} target="_blank" rel="noreferrer" className={mobileActionClassName}>
        <MessageCircle {...iconProps} size={20} />문의<span className="sr-only">(카카오톡, 새 창)</span>
      </a>
    </div>
  );
}

/**
 * md 이상 헤더의 검색창과 글자 링크. 넓은 화면에서는 아이콘보다 늘 열린 검색창이 더 많이 쓰인다(NN/g Search: Visible and Simple).
 * 검색은 일반 GET 폼이라 스크립트 없이도 /search?q=로 간다.
 */
export function DesktopHeaderActions() {
  return (
    <div className="ml-auto hidden min-w-0 items-center gap-4 md:flex">
      <form action={SEARCH_PATH} role="search" aria-label="사이트 검색" className="relative min-w-0 flex-1 lg:w-80 lg:flex-none">
        <Search {...iconProps} size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" />
        <input
          type="search"
          name="q"
          aria-label="행사, 장소 검색"
          placeholder="행사, 장소 검색"
          className="h-11 w-full min-w-40 rounded-full border border-line-input bg-surface pl-10 pr-4 text-body text-content-strong placeholder:text-content-placeholder"
        />
      </form>
      <Link href="/notices" className="inline-flex min-h-11 items-center whitespace-nowrap text-label font-medium text-content-muted hover:text-content-strong">공지</Link>
      <a href={SITE_INQUIRY_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-label font-medium text-content-muted hover:text-content-strong">
        문의<ExternalLink {...iconProps} size={14} /><span className="sr-only">(카카오톡, 새 창)</span>
      </a>
    </div>
  );
}
