import type { ReactNode } from "react";

export type BadgeTone = "danger" | "success" | "neutral" | "muted";

// 배지 규칙의 원본은 .ai/DESIGN.md의 "행사 상태의 색"과 Components > Badge다.
const badgeClassNamesByTone: Record<BadgeTone, string> = {
  danger: "bg-danger-subtle text-danger",
  success: "bg-success-subtle text-success",
  neutral: "bg-surface text-content-muted ring-1 ring-inset ring-line-strong",
  muted: "bg-surface-muted text-content-subtle",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-badge px-2 py-0.5 text-caption font-medium ${badgeClassNamesByTone[tone]}`}>
      {children}
    </span>
  );
}
