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

/** 헤더 가로 메뉴(md 이상). 지금 있는 곳은 밑줄과 글자색으로 표시하고 aria-current를 붙인다. */
export function HeaderNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {primaryDestinations.map((item) => {
          const isCurrent = item.matches(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-3 text-body font-semibold ${isCurrent ? "border-primary text-primary-text" : "border-transparent text-content-muted hover:text-content-strong"}`}
              >
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
 * 상세의 하단 행동 바가 있는 화면과 검색 화면에서는 globals.css가 숨긴다(탭 위에 바가 또 쌓이거나 키보드와 겹치지 않게).
 * 높이(위 테두리 1px + 56px)는 globals.css의 --bottom-chrome-height와 맞춘다.
 */
export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" data-bottom-nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid h-14 grid-cols-3">
        {primaryDestinations.map((item) => {
          const isCurrent = item.matches(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-caption ${isCurrent ? "font-semibold text-primary-text" : "text-content-muted"}`}
              >
                <Icon {...iconProps} size={22} strokeWidth={isCurrent ? 2.25 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
