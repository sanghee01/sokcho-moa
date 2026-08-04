type ButtonVariant = "primary" | "secondary";
type ButtonSize = "medium" | "large";
type ButtonWidth = "content" | "full" | "fullOnMobile";

const buttonBaseClassName =
  "inline-flex items-center justify-center rounded-2xl transition-colors";

const buttonClassNamesByVariant: Record<ButtonVariant, string> = {
  primary: "bg-brand-800 text-white hover:bg-brand-900",
  secondary:
    "border border-line-strong bg-surface text-content hover:bg-surface-subtle",
};

const buttonClassNamesBySize: Record<ButtonSize, string> = {
  medium: "min-h-11 px-5 py-3 font-bold",
  large: "min-h-11 px-6 py-3.5 font-black",
};

const buttonClassNamesByWidth: Record<ButtonWidth, string> = {
  content: "w-auto",
  full: "w-full",
  fullOnMobile: "w-full sm:w-auto",
};

export function getButtonClassName({
  variant,
  size,
  width,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  width: ButtonWidth;
}) {
  return [
    buttonBaseClassName,
    buttonClassNamesByVariant[variant],
    buttonClassNamesBySize[size],
    buttonClassNamesByWidth[width],
  ].join(" ");
}
