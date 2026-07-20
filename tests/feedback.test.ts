import { describe, expect, it } from "vitest";
import {
  getSiteFeedbackImageValidationError,
  hasValidSiteFeedbackImageSignature,
  SITE_FEEDBACK_IMAGE_MAX_BYTES,
  siteFeedbackDeleteSchema,
  siteFeedbackReviewSchema,
  siteFeedbackSchema,
} from "@/lib/domain/feedback";

describe("siteFeedbackSchema", () => {
  it("제목과 본문만으로 의견을 보낼 수 있다", () => {
    const result = siteFeedbackSchema.safeParse({
      title: "모바일 정렬이 편해졌어요",
      body: "행사를 찾을 때 정렬 기준을 고르기가 훨씬 편해졌습니다.",
      linkUrl: "",
      website: "",
    });

    expect(result.success).toBe(true);
  });

  it("관련 링크를 선택으로 허용하되 입력한 링크는 URL이어야 한다", () => {
    expect(siteFeedbackSchema.safeParse({
      title: "캘린더 의견",
      body: "캘린더 화면에 대한 의견을 남깁니다.",
      linkUrl: "https://example.com/calendar",
      website: "",
    }).success).toBe(true);
    expect(siteFeedbackSchema.safeParse({
      title: "캘린더 의견",
      body: "캘린더 화면에 대한 의견을 남깁니다.",
      linkUrl: "not-a-url",
      website: "",
    }).success).toBe(false);
  });

  it("짧은 제목·본문과 봇용 숨김 필드 입력을 거부한다", () => {
    expect(siteFeedbackSchema.safeParse({ title: "의", body: "짧음", linkUrl: "", website: "" }).success).toBe(false);
    expect(siteFeedbackSchema.safeParse({
      title: "사이트 의견",
      body: "본문을 충분히 입력했습니다.",
      linkUrl: "",
      website: "spam",
    }).success).toBe(false);
  });
});

describe("site feedback image validation", () => {
  it("JPG, PNG, WebP 이미지를 4MB까지 허용한다", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(getSiteFeedbackImageValidationError({ type, size: SITE_FEEDBACK_IMAGE_MAX_BYTES })).toBeNull();
    }
  });

  it("지원하지 않는 형식과 4MB 초과 이미지를 거부한다", () => {
    expect(getSiteFeedbackImageValidationError({ type: "image/gif", size: 100 })).toContain("JPG");
    expect(getSiteFeedbackImageValidationError({ type: "image/png", size: SITE_FEEDBACK_IMAGE_MAX_BYTES + 1 })).toContain("4MB");
  });

  it("확장된 MIME 정보뿐 아니라 실제 이미지 시그니처도 확인한다", async () => {
    const png = new Blob([
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ], { type: "image/png" });
    const disguisedText = new Blob(["not an image"], { type: "image/png" });

    await expect(hasValidSiteFeedbackImageSignature(png)).resolves.toBe(true);
    await expect(hasValidSiteFeedbackImageSignature(disguisedText)).resolves.toBe(false);
  });
});

describe("site feedback admin schemas", () => {
  const id = "00000000-0000-4000-8000-000000000001";

  it("검토 완료와 철회 상태만 허용한다", () => {
    expect(siteFeedbackReviewSchema.safeParse({ id, status: "reviewed" }).success).toBe(true);
    expect(siteFeedbackReviewSchema.safeParse({ id, status: "rejected" }).success).toBe(true);
    expect(siteFeedbackReviewSchema.safeParse({ id, status: "pending" }).success).toBe(false);
  });

  it("삭제할 의견의 UUID를 검증한다", () => {
    expect(siteFeedbackDeleteSchema.safeParse({ id }).success).toBe(true);
    expect(siteFeedbackDeleteSchema.safeParse({ id: "invalid" }).success).toBe(false);
  });
});
