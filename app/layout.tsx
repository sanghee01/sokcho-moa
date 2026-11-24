import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";
import { AnalyticsRuntime } from "@/components/analytics/analytics-runtime";
import { CopyrightYear } from "@/components/layout/copyright-year";
import { PathnameRecorder } from "@/components/layout/pathname-recorder";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";
import { textLinkClassName } from "@/components/ui/link-styles";
import { TransitionLink } from "@/components/ui/transition-link";
import { DesktopHeaderActions, MobileHeaderActions } from "@/components/layout/site-header-actions";
import { BottomNavigation, HeaderNavigation } from "@/components/layout/site-navigation";
import { NoticeBanner } from "@/features/notices/components/notice-banner";
import { GOOGLE_ANALYTICS_ID, shouldCollectGoogleAnalytics } from "@/lib/analytics/google-analytics";
import { INTERNAL_TRAFFIC_STORAGE_KEY, INTERNAL_TRAFFIC_TYPE } from "@/lib/analytics/internal-traffic";
import { getPublicEnv, getRuntimeEnv } from "@/lib/env";
import {
  HOME_TITLE,
  INDEXABLE_ROBOTS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OPEN_GRAPH_IMAGE_PATH,
} from "@/lib/seo/site-identity";
import { getSeoulDateParts } from "@/lib/seoul-time";
// 그림은 예전 로고에서 그라데이션·구름·갈매기를 빼고 산·바다를 한 색씩으로, 글자는 G마켓 산스 Bold 남색으로 바꿨다.
// 글꼴 파일을 사이트에 넣지 않도록 글자까지 한 장의 투명 이미지로 만든다(2026-11-07).
import headerLogo from "@/public/brand/wordmark.webp";
import "./globals.css";

// 한글 2,350자(KS X 1001)만 담은 Std 판(약 290KB)을 쓴다. 전체 판은 2MB라 모바일 첫 화면에 무겁다.
// 그 밖의 드문 글자는 globals.css의 --font-sans 대체 글꼴로 보인다. 라이선스: ./fonts/Pretendard-OFL.txt
const pretendard = localFont({
  src: "./fonts/PretendardStdVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
const collectGoogleAnalytics = shouldCollectGoogleAnalytics(getRuntimeEnv().vercelEnv);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: INDEXABLE_ROBOTS,
  // 탭 파비콘(app/icon.png, 산과 바다만)과 아이폰 홈 화면 아이콘(app/apple-icon.png, 그림 전체)은 파일 규칙으로 둔다.
  // 파일 규칙이 metadata.icons보다 우선하므로 여기서는 지정하지 않는다(2026-11-07).
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_OPEN_GRAPH_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} 로고` }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OPEN_GRAPH_IMAGE_PATH],
  },
};

/**
 * 사이트 전체가 "다 그린 뒤 보내도 된다"는 표시다(cacheComponents, 2026-11-24). 검색 유입이 대부분이라 본문을 Suspense fallback으로 미루지 않고
 * 첫 HTML에 그대로 담는다. 헤더 메뉴·하단 탭·분석은 지금 위치(usePathname)를 읽는데, Suspense로 감싸면 첫 HTML에는 현재 위치 표시가 없는
 * 메뉴가 먼저 들어가고 표시가 있는 메뉴는 푸터 뒤에서 스크립트로 바꿔 끼워져 처음 들어올 때 하단 탭 강조가 늦게 보일 수 있었다.
 * 감싸지 않으면 주소가 아직 정해지지 않은 화면(관리자 상세, 미리 만들지 않은 상세)을 미리 만들 때 이 값을 기다려야 해서 이 표시가 필요하다.
 */
export const instant = false;

const COPYRIGHT_YEAR_REVALIDATE_SECONDS = 86_400;

/**
 * 푸터 저작권 연도. 서버(Vercel)는 UTC라 getFullYear()는 1월 1일 0~9시(KST)에 전년도를 돌려준다. 서울 날짜로 센다(2026-11-07).
 * 미리 만드는 페이지에 들어가 그때의 연도가 굳으므로 하루 저장해 두고, 브라우저에서 CopyrightYear가 지금 연도로 다시 그린다.
 * cacheComponents에서는 미리 만드는 화면이 new Date()를 쓰려면 이렇게 저장 기간을 정해야 한다(2026-11-24).
 */
async function FooterCopyrightYear() {
  "use cache";
  // 하루마다 새로 만든다. 기본 이름("days")은 만료가 1주라 모든 페이지가 1주 동안 방문이 없으면 다음 방문자가 새로 그리기를 기다리게 되어 쓰지 않는다.
  cacheLife({ revalidate: COPYRIGHT_YEAR_REVALIDATE_SECONDS });
  return <CopyrightYear serverYear={getSeoulDateParts(new Date()).year} />;
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      {/* 브라우저 확장 프로그램이 hydration 전에 body 속성을 주입해도 앱 내부 오류와 구분한다. */}
      <body suppressHydrationWarning className="flex min-h-svh flex-col">
        <a href="#main-content" className="fixed left-3 top-3 z-60 -translate-y-24 rounded-control bg-surface px-4 py-3 text-label font-semibold text-primary-text shadow-floating focus:translate-y-0">
          본문으로 건너뛰기
        </a>
        {/* 어느 페이지든 내려도 헤더가 화면 위에 붙어 있다(2026-11-07 사용자 결정). 높이는 globals.css의 --site-header-height와 맞춘다.
            모바일: 로고 | 검색·공지·문의 아이콘, 주요 메뉴는 하단 탭. md 이상: 로고 | 주요 메뉴 | 검색창·공지·문의(2026-11-21 사용자 결정).
            행사 분야 탭은 헤더에서 행사 목록 안으로 옮겼다. 하단 탭까지 생기면 위아래 고정 영역이 너무 커진다.
            sticky가 아니라 fixed다: iPhone Safari는 상세에서 목록으로 돌아오며 스크롤 위치를 되살릴 때 sticky 헤더를 한 프레임 늦게 옮겨,
            헤더가 사라지고 그 자리에 목록이 비쳤다. 화면에 고정한 하단 탭은 그러지 않았다(2026-11-24 시뮬레이터 녹화). 본문은 body의 padding-top(globals.css)으로 내린다. */}
        <header className="fixed inset-x-0 top-0 z-30 border-b border-line bg-surface">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:h-18 lg:gap-6">
            {/* placeholder="blur"를 쓰지 않는다. 로고는 바탕이 투명해 흐린 미리보기가 회색 덩어리로 보이고,
                hydration이 끝날 때까지 글자 뒤에 비쳤다(2026-11-15). */}
            {/* 홈은 동적 페이지라 미리 받지 않으므로, 응답을 기다리는 동안 로고를 흐리게 해 눌렸음을 알린다.
                로고 위 스피너는 글자를 가려서 쓰지 않는다(2026-11-15). */}
            <TransitionLink href="/" pendingLabel="행사 목록 불러오는 중" showPendingIndicator={false} className="mr-auto block shrink-0 rounded-control md:mr-0">
              <Image
                src={headerLogo}
                alt="속초모아"
                priority
                sizes="(min-width: 1024px) 192px, 160px"
                className="h-9 w-auto object-contain lg:h-11"
              />
            </TransitionLink>
            <HeaderNavigation />
            <MobileHeaderActions />
            <DesktopHeaderActions />
          </div>
        </header>
        {/* 새 공지가 있으면 헤더 아래 한 줄로 알린다. 헤더와 달리 화면에 고정하지 않아 내리면 사라진다(2026-11-21 사용자 결정). */}
        <NoticeBanner />
        <AnalyticsRuntime />
        <PathnameRecorder />
        <div className="flex-1">{children}</div>
        {/* 회색 바탕 푸터. 로고 이미지는 바탕이 투명해 그대로 얹는다(2026-11-07). 묶음 제목 없이 링크만 한 줄로 둔다(2026-11-06). */}
        <footer className="mt-16 border-t border-line bg-surface-subtle">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between md:gap-10">
            <div>
              <Image src={headerLogo} alt="속초모아" sizes="128px" className="h-7 w-auto object-contain" />
              {/* 서비스 소개 한 문장과 정보 출처 안내를 함께 둔다. 다른 곳의 정보를 모아 보여 주는 서비스(여기어때·NOL)도 푸터에 출처·책임 안내를 둔다(2026-11-21 사용자 결정).
                  폭 제한 없이 한 문단이라 넓은 화면에서는 한 줄, 좁은 화면에서는 글자 폭에 맞춰 줄이 바뀐다(2026-11-06). */}
              <p className="mt-3 text-caption text-content-subtle">속초의 행사와 가볼만한 곳을 한곳에 모아 보여 줘요. 각 기관 공고를 옮긴 정보라 바뀔 수 있으니, 원문을 확인해 주세요.</p>
            </div>
            <nav aria-label="사이트 이용" className="flex flex-wrap gap-x-5">
              {/* 가볼만한 곳·공지·문의(제보·의견·카카오톡)는 헤더에 늘 있어 푸터에서 되풀이하지 않는다(2026-11-21 사용자 결정). */}
              <Link href="/privacy" className={textLinkClassName}>개인정보 처리방침</Link>
            </nav>
          </div>
          {/* 저작권 줄은 구분선으로 위 내용과 나누고, 흔히 쓰는 "All rights reserved."를 붙인다. */}
          <div className="border-t border-line">
            <p className="mx-auto max-w-6xl px-4 py-4 text-caption text-content-subtle sm:px-6">
              © <FooterCopyrightYear /> <span className="font-semibold text-content-muted">{SITE_NAME}</span>. All rights reserved.
            </p>
          </div>
        </footer>
        <BottomNavigation />
        <ScrollToTopButton />
        {/* 관리자 화면에 들어간 기기(운영자)는 첫 page_view보다 먼저 내부 트래픽 표시를 붙인다(lib/analytics/internal-traffic.ts, 2026-11-07).
            gtag('set')은 그 뒤 모든 이벤트에 적용된다. 저장소를 막은 브라우저에서는 건너뛴다. */}
        <Script id="analytics-event-queue" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            try {
              if (window.localStorage.getItem('${INTERNAL_TRAFFIC_STORAGE_KEY}') === '1') {
                gtag('set', { traffic_type: '${INTERNAL_TRAFFIC_TYPE}' });
              }
            } catch (error) {}
          `}
        </Script>
        {Boolean(collectGoogleAnalytics) && (
          <>
            <Script id="google-analytics-config" strategy="beforeInteractive">
              {`
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ANALYTICS_ID}', { send_page_view: false });
              `}
            </Script>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  );
}
