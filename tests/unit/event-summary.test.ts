import { describe, expect, it } from "vitest";
import { buildEventSummary } from "@/features/events/seo";
import { makeEvent } from "@/tests/unit/support/event-builder";

// 검색 결과·공유 미리보기·RSS 설명의 첫 문장. "언제·어디서·얼마"를 데이터로 조립한다(2026-11-15 사용자 결정: 화면에는 쓰지 않음).
describe("행사 요약 문장", () => {
  it("여러 날 행사는 언제부터 언제까지 어디서 열리는 무엇인지 한 문장으로 쓴다", () => {
    const summary = buildEventSummary(makeEvent({
      title: "제17회 속초 도루묵·양미리 축제",
      category: "festival",
      eventStartAt: "2026-11-05T15:00:00.000Z",
      eventEndAt: "2026-11-15T14:59:00.000Z",
      locationName: "속초항 항만부지",
    }));

    expect(summary).toContain("제17회 속초 도루묵·양미리 축제는 2026년 11월 6일(금)부터 11월 15일(일)까지 속초항 항만부지에서 열리는 축제입니다.");
  });

  it("하루 행사는 그날에 열린다고 쓰고, 분야마다 알맞은 이름을 쓴다", () => {
    const summary = buildEventSummary(makeEvent({
      title: "속초챔버오케스트라 정기연주회",
      category: "performance",
      eventStartAt: "2026-11-14T10:00:00.000Z",
      eventEndAt: "2026-11-14T12:00:00.000Z",
      locationName: "속초문화예술회관 대공연장",
    }));

    expect(summary).toContain("정기연주회는 2026년 11월 14일(토)에 속초문화예술회관 대공연장에서 열리는 공연입니다.");
  });

  it("해가 바뀌면 끝 날짜에도 연도를 붙인다", () => {
    const summary = buildEventSummary(makeEvent({
      eventStartAt: "2026-12-29T15:00:00.000Z",
      eventEndAt: "2027-01-04T14:59:00.000Z",
    }));

    expect(summary).toContain("2026년 12월 30일(수)부터 2027년 1월 4일(월)까지");
  });

  it("제목 끝 글자의 받침에 맞춰 은·는을 고르고, 닫는 괄호는 건너뛴다", () => {
    function subject(title: string) {
      return buildEventSummary(makeEvent({ title })).split(" 2026년")[0];
    }

    expect(subject("속초 여름 음악회 정기공연")).toBe("속초 여름 음악회 정기공연은");
    expect(subject("정기연주회 「싱포니」")).toBe("정기연주회 「싱포니」는");
    expect(subject("마실씨네 3")).toBe("마실씨네 3은");
    expect(subject("마실씨네 2")).toBe("마실씨네 2는");
    expect(subject("Moldo Duo")).toBe("Moldo Duo은(는)");
  });

  it("장소가 없으면 장소를 빼고, 온라인이면 온라인으로 열린다고 쓴다", () => {
    expect(buildEventSummary(makeEvent({ locationName: null }))).not.toContain("에서 열리는");
    expect(buildEventSummary(makeEvent({ locationName: "온라인 참여(전자도서관)", category: "education" })))
      .toContain("온라인으로 열리는 교육 프로그램입니다.");
  });

  it("문장으로 쓸 수 없는 장소 문구는 빼고 쓴다", () => {
    const summary = buildEventSummary(makeEvent({ locationName: ": 백도 해수욕장, 자작도 해수욕장 내용 : 가리비 잡기" }));

    expect(summary).not.toContain("가리비");
    expect(summary).toContain("열리는 축제입니다.");
  });

  it("요금은 무료이거나 금액이 확인된 경우만 쓴다", () => {
    expect(buildEventSummary(makeEvent({ isFree: true, priceText: "무료관람" }))).toContain("요금은 무료입니다.");
    expect(buildEventSummary(makeEvent({ isFree: false, priceText: "성인 10,000원" }))).toContain("요금은 성인 10,000원입니다.");
    expect(buildEventSummary(makeEvent({ isFree: null, priceText: "요금 안내 없음" }))).not.toContain("요금");
    expect(buildEventSummary(makeEvent({ isFree: false, priceText: "요금은 원문 확인" }))).not.toContain("요금");
  });

  it("신청 기간이 있으면 신청 기간을 쓰고, 없으면 신청 문장을 쓰지 않는다", () => {
    expect(buildEventSummary(makeEvent({
      applicationStartAt: "2026-09-30T15:00:00.000Z",
      applicationEndAt: "2026-10-10T08:00:00.000Z",
    }))).toContain("신청 기간은 2026년 10월 1일(목)부터 10월 10일(토)까지입니다.");
    expect(buildEventSummary(makeEvent({ applicationEndAt: "2026-11-10T08:00:00.000Z" })))
      .toContain("신청은 2026년 11월 10일(화)까지입니다.");
    expect(buildEventSummary(makeEvent({ applicationStartAt: null, applicationEndAt: null }))).not.toContain("신청");
  });
});
