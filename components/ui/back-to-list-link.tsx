"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { resolveReturnsToList } from "@/components/layout/list-return";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";

const textAppearanceClassName =
  "-ml-1.5 inline-flex min-h-11 items-center gap-0.5 rounded-control pr-2 text-label font-medium text-content-muted hover:text-content-strong";
// 모바일은 폭 전체, sm부터는 글자 폭만 하면 작아 보여 320px로 둔다(2026-11-07 사용자 결정).
const buttonAppearanceClassName = `${getButtonClassName({ variant: "tonal", width: "full" })} sm:w-80`;

/**
 * 상세의 "목록으로 돌아가기"(.ai/DESIGN.md BackToListLink). 맨 위 글자 링크(text)와 맨 아래 버튼(button)이 함께 쓴다.
 * 목록에서 들어왔으면 브라우저 뒤로 가기처럼 들어오기 전 화면(분류·탭, 스크롤 위치, 지도)으로 돌아간다(2026-11-22 사용자 결정).
 * 바로 들어왔으면 href의 목록으로 간다. 링크 주소(href)는 언제나 그 목록이라, 새 탭으로 열거나 스크립트가 없을 때도 목록으로 간다.
 * 목록은 동적 페이지라 미리 받지 않아, 응답을 기다리는 동안 흐리게 한다(TransitionLink).
 */
export function BackToListLink({ href, pendingLabel, appearance = "text" }: { href: string; pendingLabel: string; appearance?: "text" | "button" }) {
  const pathname = usePathname();
  // 상세가 화면에 붙을 때 정해야 한다. 누를 때 정하면 그사이 다른 페이지 기록이 섞인다.
  const returnsToListRef = useRef(false);
  useEffect(() => {
    returnsToListRef.current = resolveReturnsToList(pathname);
  }, [pathname]);

  function shouldGoBack() {
    return returnsToListRef.current;
  }

  return (
    <TransitionLink
      href={href}
      pendingLabel={pendingLabel}
      showPendingIndicator={false}
      shouldGoBack={shouldGoBack}
      className={appearance === "button" ? buttonAppearanceClassName : textAppearanceClassName}
    >
      {appearance === "text" && <ChevronLeft {...iconProps} size={18} />}
      목록으로 돌아가기
    </TransitionLink>
  );
}
