"use client";

import { Badge } from "@/components/ui/badge";
import { selectEventBadges } from "@/features/events/model/badges";
import { deriveApplicationState } from "@/features/events/model/event";
import { applicationStateLabels } from "@/features/events/model/format";
import type { EventStatusFields } from "@/features/events/model/status-fields";
import { useCurrentTime } from "@/features/events/components/use-current-time";

/**
 * 상태 배지를 방문자의 현재 시각으로 다시 고른다. 고르는 규칙은 selectEventBadges(.ai/DESIGN.md "행사 상태의 색")이고,
 * 이 컴포넌트는 시각만 바꿔 준다. 캐시된 페이지가 마감 뒤에도 "사전 신청"을 보여 주지 않게 하려는 것이다.
 */
export function LiveStatusBadges({ status, renderedAt }: { status: EventStatusFields; renderedAt: string }) {
  const now = useCurrentTime(renderedAt);
  const badges = selectEventBadges(status, now);
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" aria-label="행사 상태">
      {badges.map((badge) => <Badge key={badge.label} tone={badge.tone}>{badge.label}</Badge>)}
    </div>
  );
}

export function LiveApplicationStateLabel({ status, renderedAt }: { status: EventStatusFields; renderedAt: string }) {
  const now = useCurrentTime(renderedAt);
  return <>{applicationStateLabels[deriveApplicationState(status, now)]}</>;
}
