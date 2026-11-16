import { MapPinned } from "lucide-react";
import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import { headerEntryIconClassName } from "@/features/events/components/month/month-entry-link";

/**
 * 헤더의 "지도" 버튼(.ai/DESIGN.md 공통 헤더). 하단 탭을 넣기 전의 지도 탭 입구다(2026-11-16).
 * /map은 정적 페이지라 Next.js가 미리 받아 두므로 이동 중 표시(TransitionLink)가 필요 없다.
 */
export function MapEntryLink() {
  return (
    <Link href="/map" className={`${getButtonClassName({ variant: "tonal" })} whitespace-nowrap`}>
      <MapPinned {...iconProps} className={headerEntryIconClassName} />
      지도
    </Link>
  );
}
