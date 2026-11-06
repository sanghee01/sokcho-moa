import { describe, expect, it } from "vitest";
import { deriveEventState, filterEvents, getRelatedEvents } from "@/features/events/model/event";
import { makeEvent } from "@/tests/unit/support/event-builder";

// 종료일 없이 등록한 행사(관리자 폼의 종료 비움, 수집 후보의 eventEndAt: null)는 시작한 날(KST) 하루 행사로 본다.
// 관리자 폼이 날짜만 입력된 종료를 그날 23:59:59.999 KST로 저장하는 것과 같은 기준이다.
const startsAt7pm = makeEvent({ slug: "concert", eventStartAt: "2026-11-20T10:00:00.000Z", eventEndAt: null }); // 11/20 19:00 KST
const dateOnly = makeEvent({ slug: "date-only", eventStartAt: "2026-11-19T15:00:00.000Z", eventEndAt: null }); // 11/20 00:00 KST

function kst(value: string) {
  return new Date(`${value}+09:00`);
}

describe("종료일이 없는 행사", () => {
  it("시작 시각이 지나도 그날(KST)이 끝나기 전까지는 진행 중이다", () => {
    expect(deriveEventState(startsAt7pm, kst("2026-11-20T18:59:59"))).toBe("upcoming");
    expect(deriveEventState(startsAt7pm, kst("2026-11-20T21:00:00"))).toBe("ongoing");
    expect(deriveEventState(dateOnly, kst("2026-11-20T12:00:00"))).toBe("ongoing");
    expect(deriveEventState(dateOnly, kst("2026-11-20T23:59:59"))).toBe("ongoing");
  });

  it("다음 날(KST)이 되면 종료된다", () => {
    expect(deriveEventState(dateOnly, kst("2026-11-21T00:00:00"))).toBe("ended");
  });

  it("행사 당일에는 진행중 목록과 추천에 남는다", () => {
    const now = kst("2026-11-20T12:00:00");
    expect(filterEvents([dateOnly], { status: "active" }, now)).toHaveLength(1);
    const current = makeEvent({ slug: "current", eventStartAt: "2026-11-19T15:00:00.000Z", eventEndAt: "2026-11-21T14:59:59.999Z" });
    expect(getRelatedEvents(current, [current, dateOnly], 4, now).map((event) => event.slug)).toEqual(["date-only"]);
  });
});
