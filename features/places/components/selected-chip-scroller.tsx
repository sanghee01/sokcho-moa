"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/*
 * 가로로 미는 칩 줄에서 고른 칩(aria-current="page")이 화면 밖에 있으면 보이는 곳까지 민다(2026-11-24 사용자 요청).
 * 칩 줄은 틀(activity-list-layout.tsx)에 있어 분류를 바꿔도 가로 위치가 그대로 남는다. 칩을 눌러 바꾸면 누른 칩이 이미 보여 할 일이 없고, 아래 경우에 민다:
 * 칩 줄이 새로 만들어질 때(뒤쪽 분류 주소로 바로 들어옴, 상세에서 돌아옴, 새로 고침)와, 누르지 않고 고른 분류가 바뀔 때(뒤로·앞으로 가기, 하단 탭).
 * 뒤의 경우는 처음에 빠뜨려, 체험을 누른 뒤 뒤로 가면 칩 줄이 끝에 남아 "전체"가 화면 밖에 있었다(2026-11-24 리뷰).
 * 위치를 저장해 두지 않고 주소가 정한 고른 칩에서 계산한다. 저장한 값은 다른 경로로 목록을 새로 열 때도 되살아나 어긋난다.
 * 페이지 세로 위치는 건드리지 않는다(scrollIntoView는 칩 줄이 화면 위로 지나가 있으면 페이지까지 올려 버림). 칩 줄 칸의 scrollLeft만 바꾼다.
 * 오른쪽은 칩 줄 칸의 오른쪽 안쪽 여백(pr-4, 16px)만큼 띄워 칩이 페이지 좌우 여백 안에 들어오게 하고, 왼쪽은 칸 끝에 맞춘다.
 */

// 오른쪽에 남기는 간격. 칩 줄 칸의 오른쪽 안쪽 여백(pr-4)과 같다.
const REVEAL_END_GAP_PX = 16;

// 첫 HTML에서 스크립트를 불러오기 전에(첫 그리기 전) 민다. 공지 띠·지역 select의 inline script와 같은 방식이다.
// 아래 revealSelectedChip과 같은 계산이다. 고치면 둘을 함께 고친다.
const REVEAL_SELECTED_CHIP_SCRIPT = `(function(){try{var r=document.currentScript.previousElementSibling;var c=r&&r.querySelector('[aria-current="page"]');if(!c)return;var a=r.getBoundingClientRect(),b=c.getBoundingClientRect();if(b.right>a.right)r.scrollLeft+=b.right-a.right+${REVEAL_END_GAP_PX};else if(b.left<a.left)r.scrollLeft-=a.left-b.left}catch(e){}})()`;

function revealSelectedChip(row: HTMLElement) {
  const chip = row.querySelector('[aria-current="page"]');
  if (chip === null) return;
  const rowRect = row.getBoundingClientRect();
  const chipRect = chip.getBoundingClientRect();
  if (chipRect.right > rowRect.right) row.scrollLeft += chipRect.right - rowRect.right + REVEAL_END_GAP_PX;
  else if (chipRect.left < rowRect.left) row.scrollLeft -= rowRect.left - chipRect.left;
}

export function SelectedChipScroller({ className, children }: { className: string; children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 칩 줄이 브라우저에서 새로 만들어지거나 주소가 바뀌면 그리기 전에 민다. 고른 칩(aria-current)은 같은 commit에서 이미 바뀌어 있다.
  // 첫 HTML에서는 inline script가 이미 밀어 두어 할 일이 없다.
  useLayoutEffect(() => {
    if (rowRef.current !== null) revealSelectedChip(rowRef.current);
  }, [pathname]);

  return (
    <>
      <div ref={rowRef} className={className}>{children}</div>
      {/* 브라우저에서 새로 그린 script는 실행되지 않는데, React 개발 빌드는 그때마다 경고를 낸다. 서버 HTML에서만 실행되는 종류(text/javascript)로 두고
          브라우저에서는 실행하지 않는 종류(text/plain)로 그린다. 두 값이 달라 생기는 hydration 경고는 suppressHydrationWarning으로 끈다
          (Next.js 문서 Preventing flash before hydration, 2026-11-24 리뷰). */}
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: REVEAL_SELECTED_CHIP_SCRIPT }}
      />
    </>
  );
}
