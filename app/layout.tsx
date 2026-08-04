import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";
import { AnalyticsRuntime } from "@/components/analytics/analytics-runtime";
import { HeaderNavigation } from "@/components/header-navigation";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { googleAnalyticsId, shouldCollectGoogleAnalytics } from "@/lib/analytics/google-analytics";
import { getPublicEnv } from "@/lib/config/env";
import {
  HOME_TITLE,
  INDEXABLE_ROBOTS,
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_OPEN_GRAPH_IMAGE_PATH,
} from "@/lib/seo/site-identity";
import headerLogo from "@/public/sokchomoa-header.webp";
import "./globals.css";

const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
const collectGoogleAnalytics = shouldCollectGoogleAnalytics();
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
    <html lang="ko" data-scroll-behavior="smooth">
      {/* 브라우저 확장 프로그램이 hydration 전에 body 속성을 주입해도 앱 내부 오류와 구분한다. */}
      <body suppressHydrationWarning className="flex min-h-svh flex-col">
        <a href="#main-content" className="fixed left-3 top-3 z-50 -translate-y-24 rounded-xl bg-white px-4 py-3 font-bold text-teal-900 shadow-lg focus:translate-y-0">
          본문으로 건너뛰기
        </a>
        <header className="border-b border-teal-900/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-3 sm:px-6 sm:py-4 lg:py-0">
            <Link href="/" className="block shrink-0 overflow-hidden rounded-2xl ring-teal-700/30 focus-visible:ring-4 sm:justify-self-start">
              <Image
                src={headerLogo}
                alt="속초모아"
                priority
                placeholder="blur"
                sizes="(min-width: 640px) 176px, 128px"
                className="h-auto w-32 object-contain sm:w-44 lg:h-14 lg:object-cover lg:object-center"
              />
            </Link>
            <HeaderNavigation />
          </div>
        </header>
        <AnalyticsRuntime />
        <div className="flex-1">{children}</div>
        <footer className="mt-20 border-t border-teal-900/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-sm leading-6 text-slate-600 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <p className="font-bold text-teal-900">속초모아</p>
              <p>속초모아(속초 모아)는 속초 시민이 행사와 축제를 더 쉽게 찾도록 만든 사이트입니다. 정보가 실제 공고와 다를 수 있으니 방문·신청 전 반드시 원문을 확인해 주세요.</p>
            </div>
            <div className="shrink-0 sm:text-right">
              <nav aria-label="사이트 이용" className="mb-2 flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
                <Link href="/report" className="font-bold text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-600">
                  행사 제보하기
                </Link>
                <Link href="/feedback" className="font-bold text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-600">
                  의견 보내기
                </Link>
              </nav>
              <p>
                문의:{" "}
                <a
                  className="font-bold text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-600"
                  href="https://open.kakao.com/o/s7kFbUEi"
                  target="_blank"
                  rel="noreferrer"
                >
                  카카오톡 오픈채팅 문의 <span className="sr-only">(새 창)</span>
                </a>
              </p>
              <p>© {currentYear} 속초모아. All rights reserved.</p>
            </div>
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
