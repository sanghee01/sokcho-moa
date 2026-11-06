import { Constants, type Enums } from "@/lib/supabase/database.types";

/**
 * 행사 검수 상태. 값의 원본은 DB enum `event_review_status`이고(생성 타입), 화면 라벨은 여기 한 곳에만 둔다.
 * DB에 "비공개" 상태는 따로 없다. 공개했다가 내린 행사도 pending이라 "검수 대기"로 보인다(2026-11-06 사용자 결정).
 */
export type EventReviewStatus = Enums<"event_review_status">;

export const eventReviewStatuses = Constants.public.Enums.event_review_status;

/** 상태를 보여 줄 때(배지, 목록 필터) */
export const eventReviewStatusLabels: Record<EventReviewStatus, string> = {
  pending: "검수 대기",
  published: "공개",
  rejected: "반려",
};

/** 그 상태로 바꾸는 버튼. 버튼은 동작이라 "비공개로 전환"처럼 동사형으로 쓴다(2026-11-06 사용자 결정). */
export const eventReviewStatusActionLabels: Record<EventReviewStatus, string> = {
  published: "공개",
  pending: "비공개로 전환",
  rejected: "반려",
};

export function isEventReviewStatus(value: string | undefined): value is EventReviewStatus {
  return eventReviewStatuses.some((status) => status === value);
}
