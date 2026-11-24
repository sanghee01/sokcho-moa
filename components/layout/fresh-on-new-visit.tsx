"use client";

import { useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";

/**
 * 링크·주소로 새로 들어오면 감싼 부분을 처음 상태로 다시 만들고, 뒤로·앞으로 가기로 돌아오면 그대로 둔다.
 * cacheComponents는 떠난 화면을 숨겨 두었다가 다시 보여 줘서(React <Activity>), 의견 폼의 "보내주셔서 감사합니다"나 검색창에 적다 만 글이
 * 메뉴로 다시 들어와도 남았다. 뒤로 가기로 돌아왔을 때 적던 글이 남는 것은 그대로 둔다(2026-11-24).
 * bfcacheId는 새로 들어올 때(push·replace)만 바뀌고 뒤로·앞으로 가기에서는 그대로다(Next.js useRouter 문서).
 * 문서는 바뀐 화면마다 따로 초기화하는 방법을 먼저 권하지만, 기존 코드를 옮기는 경우에 쓰라고 한 이 방법이 폼 결과(useActionState)까지 한 번에 지운다.
 */
export function FreshOnNewVisit({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
