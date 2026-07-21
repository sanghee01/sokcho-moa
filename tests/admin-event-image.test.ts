import { describe, expect, it } from "vitest";
import { EVENT_IMAGE_MAX_BYTES, validateEventImage } from "@/lib/admin/event-image";

describe("행사 대표 이미지 검증", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("5MB 이하 %s 이미지를 허용한다", (type) => {
    expect(validateEventImage({ type, size: EVENT_IMAGE_MAX_BYTES })).toBeNull();
  });

  it("지원하지 않는 형식을 선택 단계에서 거절한다", () => {
    expect(validateEventImage({ type: "image/gif", size: 1024 })).toContain("JPG, PNG, WebP");
  });

  it("5MB를 초과한 이미지의 실제 용량을 안내한다", () => {
    expect(validateEventImage({ type: "image/png", size: 5.5 * 1024 * 1024 })).toBe(
      "선택한 파일은 5.5MB입니다. 5MB 이하 이미지를 선택해 주세요.",
    );
  });
});
