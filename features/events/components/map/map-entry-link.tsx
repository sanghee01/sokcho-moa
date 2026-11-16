import { MapPinned } from "lucide-react";
import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button-styles";
import { iconProps } from "@/components/ui/icon";
import { headerEntryIconClassName } from "@/features/events/components/month/month-entry-link";

/**
 * 헤더의 "행사 지도" 버튼(.ai/DESIGN.md 공통 헤더). 하단 탭을 넣기 전의 지도 탭 입구다(2026-11-16).
 * "지도"만으로는 무엇을 보는 지도인지 알기 어려워 "행사 지도"로 바꿨다. 360px에서는 아이콘까지 두면 헤더가 약 19px 넘쳐
 * 월별 일정처럼 글자만 둔다(2026-11-16 사용자 결정).
 * /map은 정적 페이지라 Next.js가 미리 받아 두므로 이동 중 표시(TransitionLink)가 필요 없다.
 */
export function MapEntryLink() {
  return (
    <Link href="/map" className={`${getButtonClassName({ variant: "tonal" })} whitespace-nowrap`}>
      <MapPinned {...iconProps} className={headerEntryIconClassName} />
      행사 지도
    </Link>
  );
}
