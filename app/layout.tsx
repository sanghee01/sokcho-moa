import type { Metadata } from "next";
import localFont from "next/font/local";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";
import { AnalyticsRuntime } from "@/components/analytics/analytics-runtime";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";
import { iconProps } from "@/components/ui/icon";
import { googleAnalyticsId, shouldCollectGoogleAnalytics } from "@/lib/analytics/google-analytics";
import { getPublicEnv, getRuntimeEnv } from "@/lib/env";
import {
  HOME_TITLE,
  INDEXABLE_ROBOTS,
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_OPEN_GRAPH_IMAGE_PATH,
} from "@/lib/seo/site-identity";
// 예전 로고 파일은 위아래 여백이 커서 키워도 글자가 작게 보였다. 여백을 잘라 낸 파일을 쓴다(2026-11-06).
import headerLogo from "@/public/sokchomoa-wordmark.webp";
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
const logoUrl = new URL(SITE_LOGO_PATH, siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: INDEXABLE_ROBOTS,
  icons: {
    icon: [{ url: logoUrl, type: "image/jpeg", sizes: "512x512" }],
    shortcut: logoUrl,
  },
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="ko" data-scroll-behavior="smooth" className={pretendard.variable}>
      {/* 브라우저 확장 프로그램이 hydration 전에 body 속성을 주입해도 앱 내부 오류와 구분한다. */}
      <body suppressHydrationWarning className="flex min-h-svh flex-col">
        <a href="#main-content" className="fixed left-3 top-3 z-60 -translate-y-24 rounded-control bg-surface px-4 py-3 text-label font-semibold text-primary-text shadow-floating focus:translate-y-0">
          본문으로 건너뛰기
        </a>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:h-18">
            <Link href="/" className="block shrink-0 rounded-control">
              <Image
                src={headerLogo}
                alt="속초모아"
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 192px, 160px"
                className="h-9 w-auto object-contain lg:h-11"
              />
            </Link>
          </div>
        </header>
        <AnalyticsRuntime />
        <div className="flex-1">{children}</div>
        {/* 회색 바탕 푸터. 로고 이미지의 흰 배경은 mix-blend-multiply로 바탕색에 섞어 보이지 않게 한다. 묶음 제목 없이 링크만 한 줄로 둔다(2026-11-06). */}
        <footer className="mt-16 border-t border-line bg-surface-subtle">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between md:gap-10">
            <div>
              <Image src={headerLogo} alt="속초모아" sizes="128px" className="h-7 w-auto object-contain mix-blend-multiply" />
              {/* 안내는 폭 제한 없이 한 문단으로 둔다. 넓은 화면에서는 한 줄, 좁은 화면에서는 글자 폭에 맞춰 자연스럽게 줄이 바뀐다(2026-11-06). */}
              <p className="mt-3 text-caption text-content-subtle">각 기관의 공고를 옮긴 정보라 실제와 다를 수 있어요. 방문하거나 신청하기 전에 원문을 꼭 확인해 주세요.</p>
            </div>
            <nav aria-label="사이트 이용" className="flex flex-wrap gap-x-5">
              <Link href="/report" className="inline-flex min-h-11 items-center gap-1 text-label font-medium text-primary-text underline decoration-line-strong underline-offset-4 hover:decoration-primary">행사 제보하기</Link>
              <Link href="/feedback" className="inline-flex min-h-11 items-center gap-1 text-label font-medium text-primary-text underline decoration-line-strong underline-offset-4 hover:decoration-primary">의견 보내기</Link>
              <a className="inline-flex min-h-11 items-center gap-1 text-label font-medium text-primary-text underline decoration-line-strong underline-offset-4 hover:decoration-primary" href="https://open.kakao.com/o/s7kFbUEi" target="_blank" rel="noreferrer">
                카카오톡 문의 <ExternalLink {...iconProps} size={14} /><span className="sr-only">(새 창)</span>
              </a>
            </nav>
          </div>
          {/* 저작권 줄은 구분선으로 위 내용과 나누고, 흔히 쓰는 "All rights reserved."를 붙인다. */}
          <div className="border-t border-line">
            <p className="mx-auto max-w-6xl px-4 py-4 text-caption text-content-subtle sm:px-6">
              © {currentYear} <span className="font-semibold text-content-muted">속초모아</span>. All rights reserved.
            </p>
          </div>
        </footer>
        <ScrollToTopButton />
        <Script id="analytics-event-queue" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
          `}
        </Script>
        {collectGoogleAnalytics && (
          <>
            <Script id="google-analytics-config" strategy="beforeInteractive">
              {`
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}', { send_page_view: false });
              `}
            </Script>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  );
}
