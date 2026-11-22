// 분야·분류 칩(.ai/DESIGN.md FilterChip). 행사 분야 탭, 가볼만한 곳 분류, 지도 분야가 같은 모양을 쓴다.
// 예전에는 행사 분야는 테두리 없는 글자, 가볼만한 곳은 테두리 칩으로 달라 한 사이트처럼 보이지 않았다(2026-11-21 사용자 피드백: 통일).
// 누르는 영역(44px 이상)은 바깥 링크·버튼(group)이고, 이 class는 그 안의 보이는 알약(36px)이다.
// layout "fill": 360px에서 7칸이 한 줄에 들어가게 칸 폭을 꽉 채운다(행사 분야). sm 이상은 글자 폭에 맞춘다.
export function getFilterChipClassName(isSelected: boolean, layout: "fit" | "fill" = "fit") {
  const size = layout === "fill" ? "w-full sm:w-auto sm:px-4" : "px-3.5 sm:px-4";
  return `inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full text-label ${size} ${isSelected
    ? "bg-primary font-semibold text-on-primary"
    : "bg-surface font-medium text-content ring-1 ring-inset ring-line-strong group-hover:bg-surface-subtle"}`;
}
