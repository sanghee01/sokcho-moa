import { Megaphone, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { SiteSearchForm } from "@/components/layout/site-search-form";
import { SEARCH_PATH } from "@/components/layout/site-search-href";
import { iconProps } from "@/components/ui/icon";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// 헤더 오른쪽의 검색·공지·문의(.ai/DESIGN.md 공통 헤더). 돋보기 말고는 아이콘만으로 뜻이 잘 전달되지 않아(NN/g Icon Usability)
// 공지·문의는 아이콘 아래에 작은 글자 라벨을 붙인다. md 이상도 글자 링크 대신 같은 아이콘을 쓴다(2026-11-21 사용자 결정: NOL·무신사 PC 헤더 방식).
// 문의는 카카오톡으로 바로 나가지 않고 제보·의견·카카오톡을 고르는 화면으로 간다(2026-11-21 사용자 결정, app/contact/page.tsx).
const CONTACT_PATH = "/contact";

const headerIconActionClassName = "flex size-11 flex-col items-center justify-center gap-1 rounded-control text-caption font-medium leading-none text-content-muted hover:bg-surface-subtle";

/**
 * lg 미만 헤더 아이콘. 검색은 검색 화면으로 가고, 그 화면에서 바로 입력할 수 있다.
 * md~lg(768~1023px)도 이 아이콘을 쓴다. 이 폭에서 주요 메뉴 옆에 열린 검색창을 두면 스크롤바가 자리를 차지하는 PC 브라우저에서
 * 검색창이 공지 아이콘에 붙고 안내 글자가 잘렸다(2026-11-22 리뷰, 사용자 결정).
 */
export function MobileHeaderActions() {
  return (
    <div className="flex items-center gap-3 md:ml-auto lg:hidden">
      <Link href={SEARCH_PATH} className={headerIconActionClassName}>
        <Search {...iconProps} size={20} />검색
      </Link>
      <Link href="/notices" className={headerIconActionClassName}>
        <Megaphone {...iconProps} size={20} />공지
      </Link>
      <Link href={CONTACT_PATH} className={headerIconActionClassName}>
        <MessageCircle {...iconProps} size={20} />문의
      </Link>
    </div>
  );
}

/**
 * lg 이상 헤더의 검색창과 공지·문의 아이콘. 넓은 화면에서는 아이콘보다 늘 열린 검색창이 더 많이 쓰인다(NN/g Search: Visible and Simple).
 * 검색창은 회색으로 채워 입력하는 곳임을 분명히 한다. 테두리만 있을 때는 헤더 장식처럼 보여 애매했다(2026-11-21 사용자 피드백).
 * 검색은 GET 폼이라 스크립트 없이도 /search?q=로 가고, 스크립트가 있으면 화면만 바꾸며 기다리는 동안 돋보기가 스피너로 바뀐다(site-search-form.tsx).
 * 검색 화면(/search)에서는 화면 안에 더 큰 검색창이 있어 이 검색창을 숨긴다(data-header-search, globals.css). 같은 이름의 검색 영역이 둘로 읽히지 않게 한다(2026-11-21 리뷰).
 */
export function DesktopHeaderActions() {
  return (
    <div className="ml-auto hidden min-w-0 items-center gap-4 lg:flex">
      <div data-header-search className="relative w-80 min-w-0">
        <SiteSearchForm className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-content-muted">
            <Search {...iconProps} size={18} className="group-aria-busy:hidden" />
            <LoadingSpinner className="hidden size-4 group-aria-busy:block" />
          </span>
          <input
            type="search"
            name="q"
            // 검색 화면이 받는 최대 길이(app/search/page.tsx). 넘치면 검색어가 빈 값으로 바뀌어 아무 안내 없이 최근 검색어 화면이 떴다(2026-11-21 리뷰).
            maxLength={100}
            aria-label="행사, 장소 검색"
            placeholder="행사, 장소 검색"
            className="h-11 w-full rounded-full border border-transparent bg-surface-muted pl-11 pr-4 text-body text-content-strong placeholder:text-content-placeholder hover:bg-surface-muted-hover focus:border-line-input focus:bg-surface"
          />
        </SiteSearchForm>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/notices" className={headerIconActionClassName}>
          <Megaphone {...iconProps} size={20} />공지
        </Link>
        <Link href={CONTACT_PATH} className={headerIconActionClassName}>
          <MessageCircle {...iconProps} size={20} />문의
        </Link>
      </div>
    </div>
  );
}
