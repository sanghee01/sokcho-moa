import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPublicEnv } from "@/lib/config/env";
import "./globals.css";

const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
const defaultTitle = "속초모아 | 오늘 속초에서 뭐 하지?";
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
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="fixed left-3 top-3 z-50 -translate-y-24 rounded-xl bg-white px-4 py-3 font-bold text-teal-900 shadow-lg focus:translate-y-0">
          본문으로 건너뛰기
        </a>
        <header className="border-b border-teal-900/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="block overflow-hidden rounded-2xl ring-teal-700/30 focus-visible:ring-4">
              <Image
                src="/sokchomoa-logo.jpeg"
                alt="속초모아"
                width={1254}
                height={1254}
                priority
                sizes="(min-width: 640px) 64px, 56px"
                className="h-14 w-14 object-contain sm:h-16 sm:w-16"
              />
            </Link>
            <nav aria-label="주요 메뉴" className="flex items-center gap-3 text-sm font-semibold">
              <Link href="/?when=today" className="rounded-full px-3 py-2 hover:bg-teal-50">
                오늘 행사
              </Link>
              <Link href="/admin" className="rounded-full border border-teal-900/15 px-3 py-2 hover:bg-teal-50">
                운영자
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-20 border-t border-teal-900/10 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm leading-6 text-slate-600 sm:px-6">
            <p className="font-bold text-teal-900">속초모아</p>
            <p>행사 정보는 변경될 수 있습니다. 방문·신청 전 반드시 각 카드의 원문 출처를 확인하세요.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
