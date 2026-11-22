import { describe, expect, it } from "vitest";
import { isListPathname } from "@/components/layout/list-return";

// 상세의 "목록으로 돌아가기"가 뒤로 가기로 돌아갈 목록 화면(2026-11-22 사용자 결정). 상세·안내 페이지에서 왔으면 정해 둔 목록으로 간다.
describe("isListPathname", () => {
  it("행사·가볼만한 곳 목록, 지도, 검색은 목록이다", () => {
    for (const pathname of ["/", "/topics/festival", "/months", "/months/2026-11", "/months/2026-11/festival", "/map", "/search", "/places", "/places/category/water"]) {
      expect(isListPathname(pathname), pathname).toBe(true);
    }
  });

  it("상세와 안내 페이지는 목록이 아니다", () => {
    for (const pathname of ["/events/demo-sunset-concert", "/places/seorak-waterpia", "/notices", "/contact", "/privacy", "/places/category"]) {
      expect(isListPathname(pathname), pathname).toBe(false);
    }
  });
});
