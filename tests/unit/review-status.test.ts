import { describe, expect, it } from "vitest";
import { parseSubmissionReviewStatus } from "@/components/admin/submission-review-status";
import { isEventReviewStatus } from "@/features/events/model/review-status";

describe("행사 검수 상태", () => {
  it("DB enum의 세 값만 검수 상태로 인정한다", () => {
    expect(isEventReviewStatus("pending")).toBe(true);
    expect(isEventReviewStatus("published")).toBe(true);
    expect(isEventReviewStatus("rejected")).toBe(true);
    expect(isEventReviewStatus("reviewed")).toBe(false);
    expect(isEventReviewStatus(undefined)).toBe(false);
  });
});

describe("제보·의견 검토 상태", () => {
  it("알려진 값은 그대로 쓰고, 모르는 값은 다시 검토하도록 검토 대기로 본다", () => {
    expect(parseSubmissionReviewStatus("reviewed")).toBe("reviewed");
    expect(parseSubmissionReviewStatus("rejected")).toBe("rejected");
    expect(parseSubmissionReviewStatus("published")).toBe("pending");
  });
});
