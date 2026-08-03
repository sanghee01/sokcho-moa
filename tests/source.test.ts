import { describe, expect, it } from "vitest";
import {
  canonicalizeSourceUrl,
  extractSourceExternalId,
  isKnownUnavailableOfficialUrl,
  isLikelyEventDetailUrl,
  isSameSourceUrl,
} from "@/lib/domain/source";

describe("공식 원문 URL", () => {
  it("브라우저가 같은 주소로 해석하는 원문 URL을 저장 전에 표준화한다", () => {
    expect(canonicalizeSourceUrl("https://éxample.com:0443/a/../event?eventSeq=%37%37"))
      .toBe("https://xn--xample-9ua.com/event?eventSeq=77");
    expect(canonicalizeSourceUrl("https:\\\\example.com\\a\\..\\event"))
      .toBe("https://example.com/event");
  });

  it("알려진 쿼리·경로·공식 파일에서 외부 식별자를 추출한다", () => {
    expect(extractSourceExternalId("https://sokcho.go.kr/sc/event/program?eventSeq=669")).toBe("669");
    expect(extractSourceExternalId("https://www.sokcho.go.kr/ct/tour/attraction?contentSeq=168")).toBe("168");
    expect(extractSourceExternalId("https://library.sokcho.go.kr/sokcho/menu/259/board/51/post/1079")).toBe("1079");
    expect(extractSourceExternalId("https://www.sokcho.go.kr/upload/popupzone/event-poster.jpg")).toBe("event-poster.jpg");
  });

  it.each([
    ["EDUNO", "education-101"],
    ["Idx", "festival-202"],
    ["NTT_ID", "notice-303"],
    ["destID", "destination-404"],
  ])("현재 수집 주소의 %s 식별자를 대소문자와 무관하게 추출한다", (key, id) => {
    expect(extractSourceExternalId(`https://events.example.com/detail?${key}=${id}`)).toBe(id);
  });

  it("속초시청은 감사된 상세 쿼리와 공식 팝업 이미지만 허용한다", () => {
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/portal")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/event/program")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/portal?eventSeq=669")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/event/program?eventSeq=669")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817624")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817391")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/ct/tour/tour_guide/news?articleSeq=817450")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/ct/tour/attraction?contentSeq=168")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/ct/tour/attraction")).toBe(false);
    expect(isLikelyEventDetailUrl("https://sokcho.go.kr/ct/culture/events/schedule")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/event-poster.jpg")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/upload/popupzone/event-poster.jpg")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.sokcho.go.kr/upload/notice/event-poster.jpg")).toBe(false);
  });

  it("속초시시설관리공단 행사 게시판은 bmode=view인 상세 주소만 허용한다", () => {
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&mode=view")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=list")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do?bmode=view")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view")).toBe(true);
    expect(isLikelyEventDetailUrl("https://sokchosiseol.or.kr/bbs/event.do/?bmode=VIEW&articleseq=11208")).toBe(true);
  });

  it("속초시립도서관은 post와 movie 상세 경로만 허용한다", () => {
    expect(isLikelyEventDetailUrl("https://library.sokcho.go.kr/sokcho/menu/259/board/51/post/1079")).toBe(true);
    expect(isLikelyEventDetailUrl("https://library.sokcho.go.kr/sokcho/menu/258/movie/82")).toBe(true);
    expect(isLikelyEventDetailUrl("https://library.sokcho.go.kr/sokcho/menu/259/board/51")).toBe(false);
    expect(isLikelyEventDetailUrl("https://library.sokcho.go.kr/sokcho/menu/259/board/51/post")).toBe(false);
    expect(isLikelyEventDetailUrl("https://library.sokcho.go.kr/login/post/1079")).toBe(false);
  });

  it("문화체육관광부는 festivalView와 pSeq 조합만 허용한다", () => {
    expect(isLikelyEventDetailUrl("https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp?pSeq=13468&pRo=12")).toBe(true);
    expect(isLikelyEventDetailUrl("https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.mcst.go.kr/site/s_culture/festival/festivalList.jsp?pSeq=13468")).toBe(false);
    expect(isLikelyEventDetailUrl("https://www.mcst.go.kr/login?pSeq=13468")).toBe(false);
  });

  it("알려지지 않은 기관도 인증 화면과 일반 목록 경로는 거부한다", () => {
    expect(isLikelyEventDetailUrl("https://events.example.com/login?articleSeq=1")).toBe(false);
    expect(isLikelyEventDetailUrl("https://events.example.com/member/login.do?articleSeq=1")).toBe(false);
    expect(isLikelyEventDetailUrl("https://events.example.com/account/signin")).toBe(false);
    expect(isLikelyEventDetailUrl("https://events.example.com/auth/callback/event/1")).toBe(false);
    expect(isLikelyEventDetailUrl("https://events.example.com/events")).toBe(false);
    expect(isLikelyEventDetailUrl("https://events.example.com/board/list.do")).toBe(false);
    expect(isLikelyEventDetailUrl("https://events.example.com/festival/festivalList.jsp?id=1")).toBe(false);
    expect(isLikelyEventDetailUrl("https://events.example.com/events/summer-night-2026")).toBe(true);
  });

  it("슬래시·의미 있는 쿼리 순서 차이를 제거해 중복 링크를 판정한다", () => {
    expect(isSameSourceUrl("https://example.com/event/?b=2&a=1", "https://example.com/event?a=1&b=2")).toBe(true);
  });

  it.each(["utm_source", "UTM_Medium", "fbclid", "GCLID", "dclid", "MSCLKID"])(
    "%s 추적 쿼리를 중복 링크 판정에서 제외한다",
    (trackingKey) => {
      expect(
        isSameSourceUrl(
          `https://example.com/event?b=2&${trackingKey}=tracking-value&a=1`,
          "https://example.com/event?a=1&b=2",
        ),
      ).toBe(true);
    },
  );

  it("의미 있는 쿼리 값의 차이는 유지한다", () => {
    expect(isSameSourceUrl("https://example.com/event?id=1&utm_campaign=summer", "https://example.com/event?id=2")).toBe(false);
  });

  it("현재 접속 불가능한 속초문화관광재단 링크는 공식 안내에서 제외한다", () => {
    expect(isKnownUnavailableOfficialUrl("https://sokchocf.or.kr/sokchocf/community/notice?articleSeq=4139")).toBe(true);
    expect(isKnownUnavailableOfficialUrl("https://www.sokcho.go.kr/sc/upload/popupzone/event-poster.jpg")).toBe(false);
  });
});
