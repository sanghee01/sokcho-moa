import { CalendarDays } from "lucide-react";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";

/**
 * 헤더 오른쪽 "월별 일정" 버튼(.ai/DESIGN.md 공통 헤더). 분야 탭(무엇)과 따로 두는 시간(언제)의 입구다.
 * 검색으로 상세에 바로 들어온 방문자도 보도록 모든 페이지 헤더에 둔다(2026-11-15 사용자 결정).
 * /months는 요청할 때 이번 달로 보내는 동적 주소라 미리 받지 않아, 응답을 기다리는 동안 흐리게 표시한다.
 */
export function MonthEntryLink() {
  return (
    <TransitionLink href="/months" pendingLabel="이번 달 행사 불러오는 중" showPendingIndicator={false} className={getButtonClassName({ variant: "tonal" })}>
      <CalendarDays {...iconProps} />
      월별 일정
    </TransitionLink>
  );
}
