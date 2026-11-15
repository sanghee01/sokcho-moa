import Link from "next/link";
import { textLinkClassName } from "@/components/ui/link-styles";
import {
  eventMonthPath,
  formatEventMonthLabel,
  type EventMonth,
} from "@/features/events/model/event-month";

/**
 * 월별 행사 페이지로 가는 글자 링크 묶음. 홈·주제 목록 아래(이번 달·다음 달)와 월 페이지 아래(지난 달·다음 달)에 둔다.
 * 사이트 안에서 월 페이지로 이어지는 링크가 있어야 검색엔진이 중요한 페이지로 본다(2026-11-15 사용자 결정: 목록 아래 텍스트 링크).
 */
export function EventMonthLinks({ months, label, className = "" }: { months: EventMonth[]; label: string; className?: string }) {
  if (months.length === 0) return null;
  return (
    <nav aria-label={label} className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`}>
      {months.map((month) => (
        <Link key={eventMonthPath(month)} href={eventMonthPath(month)} className={textLinkClassName}>
          {formatEventMonthLabel(month)} 행사 일정
        </Link>
      ))}
    </nav>
  );
}
