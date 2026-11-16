import { CalendarDays } from "lucide-react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";

/**
 * 헤더 오른쪽 "월별 일정" 버튼(.ai/DESIGN.md 공통 헤더). 분야 탭(무엇)과 따로 두는 시간(언제)의 입구다.
 * 검색으로 상세에 바로 들어온 방문자도 보도록 모든 페이지 헤더에 둔다(2026-11-15 사용자 결정).
 * /months는 요청할 때 이번 달로 보내는 동적 주소라 미리 받지 않아, 응답을 기다리는 동안 흐리게 표시한다.
 */
/**
 * 헤더 버튼(행사 지도·월별 일정)의 아이콘. 360px에서 로고 + 버튼 두 개(아이콘 포함 약 380px)가 한 줄에 들어가지 않아
 * 글자만 남기고 sm부터 아이콘을 보인다. 아이콘을 두면 "월별 일정"이 두 줄로 꺾였다(2026-11-16).
 */
export const headerEntryIconClassName = "hidden sm:block";

export function MonthEntryLink() {
  return (
    <TransitionLink href="/months" pendingLabel="이번 달 행사 불러오는 중" showPendingIndicator={false} className={`${getButtonClassName({ variant: "tonal" })} whitespace-nowrap`}>
      <CalendarDays {...iconProps} className={headerEntryIconClassName} />
      월별 일정
    </TransitionLink>
  );
}
