"use client";

import { CalendarDays, Map as MapIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { iconProps } from "@/components/ui/icon";

// 사이트의 최상위 목적지 세 곳(.ai/DESIGN.md 주요 메뉴). 모바일은 하단 탭, md 이상은 헤더 가로 메뉴로 같은 세 곳을 보인다.
// 숨긴 메뉴(햄버거)보다 보이는 메뉴를 더 많이 쓰고(NN/g: 57% 대 86%), 탭이 3개면 360px에서도 라벨을 늘 보일 수 있다(2026-11-21 사용자 결정).
// 이 파일은 도메인을 모르므로 주소와 이름만 둔다.
const primaryDestinations = [
  { href: "/", label: "행사", icon: CalendarDays, matches: (path: string) => path === "/" || /^\/(topics|months|events)(\/|$)/.test(path) },
  { href: "/places", label: "가볼만한 곳", icon: MapPin, matches: (path: string) => /^\/places(\/|$)/.test(path) },
  { href: "/map", label: "지도", icon: MapIcon, matches: (path: string) => path === "/map" },
] as const;

/**
 * 헤더 가로 메뉴(md 이상). 하단 탭과 같은 아이콘 + 글자이고, 지금 있는 곳은 하단 탭처럼 옅은 바다색 알약 배경 + 굵은 글자로 표시한다(aria-current).
 * 봄봄 PC 헤더처럼 메뉴 칸 전체를 알약으로 감싼다. 진한 바다색으로 채우면 바로 아래 고른 분야 칩(진한 바다색)과 겹쳐 무거워 보여 옅은 색을 쓴다.
 * 예전 밑줄 표시는 작은 글자와 함께 어색해 보였다(2026-11-21 사용자 피드백 두 번).
 */
export function HeaderNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="hidden md:ml-2 md:block lg:ml-6">
      <ul className="flex items-center gap-1 lg:gap-2">
        {primaryDestinations.map((item) => {
          const isCurrent = item.matches(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-body lg:px-4 ${isCurrent ? "bg-primary-subtle-hover font-bold text-primary-text" : "font-medium text-content-muted hover:bg-surface-muted hover:text-content-strong"}`}
              >
                <Icon {...iconProps} size={20} strokeWidth={isCurrent ? 2.25 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * 모바일 하단 탭(md 미만). 스크롤해도 숨기지 않는다(Apple HIG Tab bars). 아이콘과 한 단어 라벨을 늘 함께 보인다.
 * 지금 탭은 아이콘 뒤 알약 모양 배경 + 굵은 진한 글자 + 바다색 아이콘으로 겹쳐 표시한다(Material 3 navigation bar의 active indicator).
 * 예전에는 글자·아이콘 색과 선 굵기만 달라 알아보기 어려웠다(2026-11-21 사용자 피드백, WCAG 1.4.1 색만으로 구분하지 않기).
 * 상세의 하단 행동 바가 있는 화면과 검색 화면에서는 globals.css가 숨긴다(탭 위에 바가 또 쌓이거나 키보드와 겹치지 않게).
 * 높이(위 테두리 1px + 64px)는 globals.css의 --bottom-chrome-height와 맞춘다.
 */
export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" data-bottom-nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid h-16 grid-cols-3">
        {primaryDestinations.map((item) => {
          const isCurrent = item.matches(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`group flex h-full flex-col items-center justify-center gap-1 text-caption ${isCurrent ? "font-bold text-content-strong" : "text-content-muted"}`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full ${isCurrent ? "bg-primary-subtle-hover text-primary-text" : "group-hover:bg-surface-muted"}`}>
                  <Icon {...iconProps} size={22} strokeWidth={isCurrent ? 2.25 : 1.75} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
