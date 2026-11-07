// 버튼 규칙의 원본은 .ai/DESIGN.md의 Components > Button이다. 한 화면에 primary는 하나만 쓴다.
// 바탕색이 없는 ghost는 흰 화면에서 버튼으로 보이지 않아 없앴다. 눈에 띄어야 하는 행동은 채운 버튼(primary 파랑·accent 차콜),
// 나란히 놓인 보조 행동은 바탕색으로 구분한다(tonal 파랑·neutral 회색)(2026-11-07 사용자 결정).
// danger는 확인 창 안에서 되돌릴 수 없는 동작을 확정하는 버튼에만 쓴다. 예전에는 확인 창이 따로 버튼 class를 가지고 있었다(2026-11-07).
type ButtonVariant = "primary" | "accent" | "tonal" | "neutral" | "secondary" | "danger";
type ButtonSize = "md" | "lg";
type ButtonWidth = "content" | "full" | "fullOnMobile";

// transition은 색과 투명도를 함께 움직인다. TransitionLink도 같은 값을 써서, 링크 버튼에서 두 transition class가 서로 덮지 않는다(2026-11-07).
const buttonBaseClassName =
  "inline-flex items-center justify-center gap-2 rounded-control text-label font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

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

export function getButtonClassName({
  variant,
  size = "md",
  width = "content",
}: {
  variant: ButtonVariant;
  size?: ButtonSize;
  width?: ButtonWidth;
}) {
  return [
    buttonBaseClassName,
    buttonClassNamesByVariant[variant],
    buttonClassNamesBySize[size],
    buttonClassNamesByWidth[width],
  ].join(" ");
}
