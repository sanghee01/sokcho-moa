// 버튼 규칙의 원본은 .ai/DESIGN.md의 Components > Button이다. 한 화면에 primary는 하나만 쓴다.
// 바탕색이 없는 ghost는 흰 화면에서 버튼으로 보이지 않아 없앴다. 눈에 띄어야 하는 행동은 채운 버튼(primary 파랑·accent 차콜),
// 나란히 놓인 보조 행동은 바탕색으로 구분한다(tonal 파랑·neutral 회색)(2026-11-07 사용자 결정).
// danger는 확인 창 안에서 되돌릴 수 없는 동작을 확정하는 버튼에만 쓴다. 예전에는 확인 창이 따로 버튼 class를 가지고 있었다(2026-11-07).
type ButtonVariant = "primary" | "accent" | "tonal" | "neutral" | "secondary" | "danger";
type ButtonSize = "md" | "lg";
type ButtonWidth = "content" | "full" | "fullOnMobile";

// transition은 색과 투명도를 함께 움직인다. TransitionLink도 같은 값을 써서, 링크 버튼에서 두 transition class가 서로 덮지 않는다(2026-11-07).
// *:shrink-0: 폭이 모자라면 flex가 아이콘(svg)을 0에 가깝게 줄여, 아이콘은 사라지고 간격(gap)만 남아 글자가 한쪽으로 밀렸다
// (360px 장소 상세의 버튼 3개, 2026-11-21 사용자 피드백). 아이콘과 글자는 줄어들지 않게 하고, 자리가 모자라면 버튼 배치를 바꾼다.
const buttonBaseClassName =
  "inline-flex items-center justify-center gap-2 rounded-control text-label font-semibold transition *:shrink-0 disabled:cursor-not-allowed disabled:opacity-60";

const buttonClassNamesByVariant: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  accent: "bg-accent text-on-primary hover:bg-accent-hover",
  tonal: "bg-primary-subtle text-primary-text hover:bg-primary-subtle-hover",
  neutral: "bg-surface-muted text-content-strong hover:bg-surface-muted-hover",
  secondary: "border border-line-strong bg-surface text-content-strong hover:bg-surface-subtle",
  danger: "bg-danger text-on-primary hover:bg-danger/90",
};

const buttonClassNamesBySize: Record<ButtonSize, string> = {
  md: "min-h-11 px-4",
  lg: "min-h-13 px-5 text-body",
};

const buttonClassNamesByWidth: Record<ButtonWidth, string> = {
  content: "w-auto",
  full: "w-full",
  fullOnMobile: "w-full sm:w-auto",
};

// 글자 앞에 16px 아이콘이 있는 버튼은 오른쪽에 같은 크기의 빈 자리(::after)를 둔다. 아이콘+글자 묶음이 아니라 글자가
// 버튼 한가운데 오게 하려는 것이다(2026-11-21 사용자 피드백: "텍스트 기준 가운데 정렬"). 아이콘 크기는 16px로 맞춘다.
const leadingIconBalanceClassName = "after:size-4 after:shrink-0 after:content-['']";

export function getButtonClassName({
  variant,
  size = "md",
  width = "content",
  hasLeadingIcon = false,
}: {
  variant: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;
  /** 글자 앞에 16px 아이콘이 있으면 true. 글자가 버튼 가운데 오도록 오른쪽 빈 자리를 맞춘다. */
  hasLeadingIcon?: boolean;
}) {
  return [
    buttonBaseClassName,
    buttonClassNamesByVariant[variant],
    buttonClassNamesBySize[size],
    buttonClassNamesByWidth[width],
    hasLeadingIcon ? leadingIconBalanceClassName : "",
  ].join(" ");
}
