// 버튼 규칙의 원본은 .ai/DESIGN.md의 Components > Button이다. 한 화면에 primary는 하나만 쓴다.
type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";
type ButtonWidth = "content" | "full" | "fullOnMobile";

const buttonBaseClassName =
  "inline-flex items-center justify-center gap-2 rounded-control text-label font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const buttonClassNamesByVariant: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-content-strong hover:bg-surface-subtle",
  ghost: "text-primary-text hover:bg-primary-subtle",
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
