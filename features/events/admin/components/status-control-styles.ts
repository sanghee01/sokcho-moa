// 행사 검수 상태 버튼 묶음의 배치·저장 중 표시. 버튼 모양은 components/admin/status-toggle-styles.ts, 배지는 Badge가 맡는다(2026-11-07).
export const statusControlStyles = {
  controls: "relative isolate flex flex-nowrap gap-2",
  spinner: "size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent",
  liveHidden: "sr-only",
  liveError: "absolute right-0 top-full z-10 mt-2 w-max max-w-72 rounded-control bg-danger-subtle px-3 py-2 text-caption font-bold text-danger shadow-floating ring-1 ring-danger-subtle",
  actionCell: "min-w-[23rem] px-4 py-4",
} as const;
