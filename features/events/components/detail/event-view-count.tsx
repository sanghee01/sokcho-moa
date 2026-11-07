import { formatViewCount } from "@/features/events/model/format";

/** 조회수. "조회수 N"으로만 보여 준다(아이콘은 쓰지 않음, 2026-11-06 사용자 결정). */
export function EventViewCount({ value, className = "" }: { value: number; className?: string }) {
  const count = formatViewCount(value);

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap tabular-nums ${className}`}>
      <span>조회수</span>
      <span>{count}</span>
    </span>
  );
}
