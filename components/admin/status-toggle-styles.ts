// 관리자 상태 버튼 묶음(.ai/DESIGN.md Components > StatusToggle). 행사 검수 상태와 제보·의견 검토 상태가 함께 쓴다.
// 일반 버튼(getButtonClassName)과 달리 상태마다 색이 뜻을 가진다(공개·검토 완료 초록, 반려 빨강 계열). 예전에는 두 곳이 따로 만들어
// 높이가 36px이었다(2026-11-07).
export type StatusToggleTone = "success" | "danger" | "neutral";

const statusToggleClassNamesByTone: Record<StatusToggleTone, string> = {
  success: "bg-success text-on-primary",
  danger: "bg-danger-subtle text-danger",
  neutral: "bg-surface-muted text-content",
};

/** 지금 상태의 버튼은 disabled로 흐리게 보이고, aria-pressed로 눌린 상태를 알린다. 높이 44px. */
export function getStatusToggleClassName(tone: StatusToggleTone) {
  return `inline-flex min-h-11 min-w-20 items-center justify-center gap-1.5 whitespace-nowrap rounded-control px-3 text-label font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${statusToggleClassNamesByTone[tone]}`;
}
