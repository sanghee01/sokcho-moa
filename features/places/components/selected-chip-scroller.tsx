"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/*
 * 가로로 미는 칩 줄에서 고른 칩(aria-current="page")이 화면 밖에 있으면 보이는 곳까지 민다(2026-11-24 사용자 요청).
 * 분류를 바꿀 때는 칩 줄이 틀(activity-list-layout.tsx)에 남아 위치가 그대로라 이 계산이 필요 없다. 칩 줄이 새로 만들어질 때만 쓴다:
 * 뒤쪽 분류 주소로 바로 들어왔을 때(검색 유입), 상세에서 돌아왔을 때, 새로 고쳤을 때.
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

  // 칩 줄이 브라우저에서 새로 만들어질 때(상세에서 돌아옴 등) 그리기 전에 민다. 첫 HTML에서는 inline script가 이미 밀어 두어 할 일이 없다.
  useLayoutEffect(() => {
    if (rowRef.current !== null) revealSelectedChip(rowRef.current);
  }, []);

  return (
    <>
      <div ref={rowRef} className={className}>{children}</div>
      <script dangerouslySetInnerHTML={{ __html: REVEAL_SELECTED_CHIP_SCRIPT }} />
    </>
  );
}
