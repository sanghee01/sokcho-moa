import type { Event } from "@/features/events/model/event";

/** 행사·신청 상태 계산에 필요한 필드. 브라우저에서 상태를 다시 계산할 때 행사 전체 대신 이것만 넘긴다. */
export type EventStatusFields = Pick<
  Event,
  "eventStartAt" | "eventEndAt" | "applicationStartAt" | "applicationEndAt" | "applicationUrl" | "isFree"
>;

export function pickEventStatusFields(event: Event): EventStatusFields {
  return {
    eventStartAt: event.eventStartAt,
    eventEndAt: event.eventEndAt,
    applicationStartAt: event.applicationStartAt,
    applicationEndAt: event.applicationEndAt,
    applicationUrl: event.applicationUrl,
    isFree: event.isFree,
  };
}
