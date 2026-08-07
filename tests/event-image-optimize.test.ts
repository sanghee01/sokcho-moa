import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { EventImageOptimizationError, optimizeEventImage } from "@/lib/admin/event-image-optimize";

describe("행사 포스터 최적화", () => {
  it("지원 이미지 입력을 WebP로 변환한다", async () => {
    const source = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#0f766e" },
    }).png().toBuffer();
    const optimized = await optimizeEventImage(source);

    expect((await sharp(optimized).metadata()).format).toBe("webp");
  });

  it("이미지가 아닌 입력은 안내 가능한 오류로 거절한다", async () => {
    await expect(optimizeEventImage(new TextEncoder().encode("not an image")))
      .rejects.toBeInstanceOf(EventImageOptimizationError);
  });
});
