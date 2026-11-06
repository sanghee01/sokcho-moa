import type { Event } from "@/features/events/model/event";
import { LiveStatusBadges } from "@/features/events/components/live-event-status";
import { pickEventStatusFields } from "@/features/events/model/status-fields";

/** 행사·신청 상태 배지. 상태는 시간에 따라 바뀌므로 브라우저에서 현재 시각으로 다시 계산한다. */
export function StatusBadges({ event }: { event: Event }) {
  return <LiveStatusBadges status={pickEventStatusFields(event)} renderedAt={new Date().toISOString()} />;
}
