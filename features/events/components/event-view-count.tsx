import { formatViewCount } from "@/features/events/model/format";

export function EventViewCount({ value, className = "" }: { value?: number; className?: string }) {
  const count = formatViewCount(value);

  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap tabular-nums ${className}`}>
      {count}회
    </span>
  );
}
