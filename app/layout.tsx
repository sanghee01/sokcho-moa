import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";
import { AnalyticsRuntime } from "@/components/analytics/analytics-runtime";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { TransitionLink } from "@/components/transition-link";
import { getPublicEnv } from "@/lib/config/env";
import headerLogo from "@/public/sokchomoa-header.webp";
import "./globals.css";

const googleAnalyticsId = "G-9KN84HHJKD";
const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
const defaultTitle = "속초모아 | 요즘 속초에서 뭐 하지?";
const description = "속초의 행사·공연·축제·체험·교육 프로그램을 한곳에서 비교하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: "%s | 속초모아" },
  description,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.jpeg", type: "image/jpeg" }],
    shortcut: "/icon.jpeg",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "속초모아",
    title: defaultTitle,
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "속초모아" }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const currentYear = new Date().getFullYear();
  const { getAdminIdentity } = await import("@/lib/admin/auth");
  const admin = await getAdminIdentity();

  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="fixed left-3 top-3 z-50 -translate-y-24 rounded-xl bg-white px-4 py-3 font-bold text-teal-900 shadow-lg focus:translate-y-0">
          본문으로 건너뛰기
        </a>
        <header className="border-b border-teal-900/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:py-0">
            <Link href="/" className="block overflow-hidden rounded-2xl ring-teal-700/30 focus-visible:ring-4">
              <Image
                src={headerLogo}
                alt="속초모아"
                priority
                placeholder="blur"
                sizes="(min-width: 640px) 176px, 144px"
                className="h-auto w-36 object-contain sm:w-44 lg:h-14 lg:object-cover lg:object-center"
              />
            </Link>
            <nav aria-label="주요 메뉴" className="grid w-full grid-cols-2 gap-2 text-xs font-semibold sm:flex sm:w-auto sm:items-center sm:gap-3 sm:text-sm">
              <TransitionLink href="/calendar" pendingLabel="행사 캘린더 불러오는 중" showPendingIndicator={false} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-teal-800 px-2 py-2 text-center font-black text-white shadow-sm hover:bg-teal-900 active:scale-[0.98] sm:rounded-full sm:px-4">
                행사 캘린더
              </TransitionLink>
              <TransitionLink href="/report" pendingLabel="제보 페이지 불러오는 중" showPendingIndicator={false} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-teal-800 px-2 py-2 text-center font-black text-teal-800 hover:bg-teal-50 active:scale-[0.98] sm:rounded-full sm:px-4">
                제보하기
              </TransitionLink>
              {admin && (
                <TransitionLink href="/admin" showPendingIndicator={false} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-teal-900/15 px-2 py-2 text-center hover:bg-teal-50 active:scale-[0.98] sm:rounded-full sm:px-3">
                  운영자
                </TransitionLink>
              )}
            </nav>
          </div>
        </header>
        <AnalyticsRuntime />
        {children}
        <footer className="mt-20 border-t border-teal-900/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-sm leading-6 text-slate-600 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <p className="font-bold text-teal-900">속초모아</p>
              <p>행사 정보는 변경될 수 있습니다. 방문·신청 전 반드시 각 카드의 원문 출처를 확인하세요.</p>
            </div>
            <div className="shrink-0 sm:text-right">
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
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
