import { formatViewCount } from "@/lib/domain/format";

export function EventViewCount({ value, className = "" }: { value?: number; className?: string }) {
  const count = formatViewCount(value);

  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap font-normal tabular-nums text-slate-500 ${className}`}>
      조회 {count}
    </span>
  );
}
