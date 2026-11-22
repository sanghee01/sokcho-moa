import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { iconProps } from "@/components/ui/icon";

/**
 * 목록 위에 두는 한 줄 안내 띠(.ai/DESIGN.md InfoNote). 방문 전에 꼭 알아야 할 것 한 가지만 짧게 쓴다.
 * 예전에는 목록 맨 아래 작은 회색 문단이라 잘 안 보이고 줄바꿈도 어색했다. 봄봄처럼 필터 바로 아래 옅은 바탕 띠로 옮겼다(2026-11-21 사용자 결정).
 */
export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-control border-l-4 border-primary bg-primary-subtle px-4 py-3 text-label font-normal text-content">
      <Info {...iconProps} size={18} className="mt-px shrink-0 text-primary-text" />
      <span>{children}</span>
    </p>
  );
}
