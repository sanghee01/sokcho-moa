"use client";

import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * 이 화면이 보이는 동안의 주소 값(?…). 화면을 떠나 숨겨 둔 동안(cacheComponents의 <Activity>)에는 떠나기 전 값을 그대로 돌려준다.
 * useSearchParams는 숨은 화면에도 지금 주소(다른 페이지의 값)를 준다. 지도에서 장소 카드(?place=)를 연 채 상세로 가면 숨은 지도가 카드를 지웠다가,
 * 돌아올 때 새로 그려 포스터가 한 프레임 회색 칸으로 깜빡였다(2026-11-24 시뮬레이터 녹화). 떠나기 전 값을 두면 카드와 포스터가 그대로 남는다.
 * 지금 주소가 이 화면의 주소인지는 isOwnPathname으로 가린다. 다른 링크로 이 화면에 다시 오면 그 주소의 값을 바로 쓴다.
 */
export function useSearchParamsWhileShown(isOwnPathname: (pathname: string) => boolean): ReadonlyURLSearchParams {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [shownSearchParams, setShownSearchParams] = useState(searchParams);
  const isShown = isOwnPathname(pathname);
  // 렌더 중에 이전 값을 맞춰 둔다(React 문서의 "props가 바뀔 때 state 조정"). 같은 주소면 다시 그리지 않도록 문자열로 비교한다.
  if (isShown && searchParams.toString() !== shownSearchParams.toString()) setShownSearchParams(searchParams);
  return isShown ? searchParams : shownSearchParams;
}
