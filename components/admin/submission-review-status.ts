/**
 * 방문자 제보(event_reports)와 의견(site_feedback)의 검토 상태. 두 테이블이 같은 값을 쓰고(text + check 제약),
 * 같은 검토 카드(SubmissionReviewCard)로 다루므로 값과 라벨을 여기 한 곳에 둔다.
 * 행사 검수 상태(features/events/model/review-status.ts)와는 값도 뜻도 달라 합치지 않는다.
 * DB에는 enum이 아니라 check 제약이라 생성 타입이 string이다. 그래서 읽을 때 parseSubmissionReviewStatus로 좁힌다.
 */
export const submissionReviewStatuses = ["pending", "reviewed", "rejected"] as const;

export type SubmissionReviewStatus = (typeof submissionReviewStatuses)[number];

/** 관리자가 버튼으로 고를 수 있는 상태. 검토 대기로 되돌리는 버튼은 없다. */
export const submissionReviewDecisions = ["reviewed", "rejected"] as const satisfies readonly SubmissionReviewStatus[];

export type SubmissionReviewDecision = (typeof submissionReviewDecisions)[number];

export const submissionReviewStatusLabels: Record<SubmissionReviewStatus, string> = {
  pending: "검토 대기",
  reviewed: "검토 완료",
  rejected: "철회",
};

/** DB check 제약이 세 값만 허용한다. 그래도 모르는 값이 오면 검토가 필요하도록 "검토 대기"로 본다. */
export function parseSubmissionReviewStatus(value: string): SubmissionReviewStatus {
  return submissionReviewStatuses.find((status) => status === value) ?? "pending";
}
