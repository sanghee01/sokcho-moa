import { describe, expect, it } from "vitest";
import { extractSourceExternalId, isLikelyEventDetailUrl, isSameSourceUrl } from "@/lib/domain/source";

describe("공식 원문 URL", () => {
  it("알려진 쿼리·경로·공식 파일에서 외부 식별자를 추출한다", () => {
    expect(extractSourceExternalId("https://sokcho.go.kr/sc/event/program?eventSeq=669")).toBe("669");
    expect(extractSourceExternalId("https://library.sokcho.go.kr/sokcho/menu/259/board/51/post/1079")).toBe("1079");
    expect(extractSourceExternalId("https://www.sokcho.go.kr/upload/popupzone/event-poster.jpg")).toBe("event-poster.jpg");
  });

  it("기관 대표 홈과 알려진 목록은 거부하고 행사 상세·공식 파일은 허용한다", () => {
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/portal")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/upload/popupzone/event-poster.jpg")).toBe(true);
  });

  it("슬래시·쿼리 순서 차이를 제거해 중복 링크를 판정한다", () => {
    expect(isSameSourceUrl("https://example.com/event/?b=2&a=1", "https://example.com/event?a=1&b=2")).toBe(true);
  });
});
