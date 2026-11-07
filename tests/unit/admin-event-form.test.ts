import { describe, expect, it } from "vitest";
import {
  combineDateAndOptionalTime,
  isoToSeoulDatetimeLocal,
  seoulDateOrDatetimeToIso,
  seoulDatetimeLocalToIso,
} from "@/features/events/admin/datetime";
import { buildEventPayload } from "@/features/events/admin/event-payload";
import { eventFormSchema } from "@/features/events/admin/schemas";

/** 관리자 행사 폼에서 넘어오는 값. 테스트마다 필요한 필드만 덮어쓴다. */
function form(overrides: Record<string, unknown> = {}) {
  return {
    slug: "admin-form-event",
    title: "관리자 폼 테스트 행사",
    introduction: "",
    category: "other",
    audiences: ["all"],
    eventStartAt: "2026-07-19T14:30",
    eventEndAt: "2026-07-19",
    operatingHours: "",
    scheduleMode: "continuous",
    occurrences: [],
    applicationStartAt: "",
    applicationEndAt: "",
    locationName: "",
    address: "",
    priceText: "",
    isFree: "unknown",
    organizer: "",
    contact: "",
    applicationUrl: "",
    imageUrl: "",
    sourceName: "공식 출처",
    sourceUrl: "https://example.com/events/admin-form-event",
    isFeatured: false,
    ...overrides,
  };
}

const VERIFIED_AT = "2026-07-21T05:30:00.000Z";

describe("관리자 입력 시각은 한국 시간으로 해석한다", () => {
  it("날짜와 선택 시간을 합친다", () => {
    expect(combineDateAndOptionalTime("2026-07-19", "")).toBe("2026-07-19");
    expect(combineDateAndOptionalTime("2026-07-19", "14:30")).toBe("2026-07-19T14:30");
  });

  it("datetime-local 값을 서버 시간대와 관계없이 KST로 보고 UTC로 왕복 변환한다", () => {
    expect(seoulDatetimeLocalToIso("2026-07-19T14:30")).toBe("2026-07-19T05:30:00.000Z");
    expect(isoToSeoulDatetimeLocal("2026-07-19T05:30:00.000Z")).toBe("2026-07-19T14:30");
    // KST 새해 0시 15분은 UTC로 전년도 12월 31일이다.
    expect(seoulDatetimeLocalToIso("2026-01-01T00:15")).toBe("2025-12-31T15:15:00.000Z");
  });

  it("존재하지 않는 날짜는 거부한다", () => {
    expect(() => seoulDatetimeLocalToIso("2026-02-30T09:00")).toThrow();
    expect(() => seoulDateOrDatetimeToIso("2026-02-30")).toThrow();
  });

  it("날짜만 있으면 시작은 그날 0시, 종료는 그날 끝으로 저장한다", () => {
    const parsed = eventFormSchema.parse(form({
      eventStartAt: "2026-07-19",
      eventEndAt: "2026-07-20",
      applicationStartAt: "2026-07-01",
      applicationEndAt: "2026-07-18",
    }));

    expect(parsed.eventStartAt).toBe("2026-07-18T15:00:00.000Z");
    expect(parsed.eventEndAt).toBe("2026-07-20T14:59:59.999Z");
    expect(parsed.applicationEndAt).toBe("2026-07-18T14:59:59.999Z");
  });

  it("폼 schema도 같은 KST 변환을 쓴다", () => {
    expect(eventFormSchema.parse(form()).eventStartAt).toBe("2026-07-19T05:30:00.000Z");
  });
});

describe("운영 회차", () => {
  function occurrenceForm(overrides: Record<string, unknown> = {}) {
    return form({
      eventStartAt: "2026-07-22T09:00",
      eventEndAt: "2026-07-29T21:00",
      scheduleMode: "occurrences",
      occurrences: [
        { startsAt: "2026-07-22T19:00", endsAt: "2026-07-22T21:00" },
        { startsAt: "2026-07-29T19:00", endsAt: "2026-07-29T21:00" },
      ],
      ...overrides,
    });
  }

  it("KST 회차 입력을 UTC로 저장한다", () => {
    expect(eventFormSchema.parse(occurrenceForm()).occurrences).toEqual([
      { startsAt: "2026-07-22T10:00:00.000Z", endsAt: "2026-07-22T12:00:00.000Z" },
      { startsAt: "2026-07-29T10:00:00.000Z", endsAt: "2026-07-29T12:00:00.000Z" },
    ]);
  });

  it("회차 모드에는 회차가 한 개 이상 필요하다", () => {
    const result = eventFormSchema.safeParse(occurrenceForm({ occurrences: [] }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "occurrences")).toBe(true);
  });

  it("회차 종료가 시작보다 빠르면 거부한다", () => {
    const result = eventFormSchema.safeParse(occurrenceForm({
      occurrences: [{ startsAt: "2026-07-22T21:00", endsAt: "2026-07-22T19:00" }],
    }));
    expect(result.success).toBe(false);
  });

  it("시간이 없는 회차는 그날 전체로 저장한다", () => {
    const parsed = eventFormSchema.parse(occurrenceForm({
      occurrences: [{ startsAt: "2026-07-22", endsAt: "2026-07-22" }],
    }));
    expect(parsed.occurrences).toEqual([{ startsAt: "2026-07-21T15:00:00.000Z", endsAt: "2026-07-22T14:59:59.999Z" }]);
  });

  it("연속 일정은 회차 없이 저장한다", () => {
    const parsed = eventFormSchema.parse(occurrenceForm({ scheduleMode: "continuous", occurrences: [] }));
    expect(parsed.scheduleMode).toBe("continuous");
    expect(parsed.occurrences).toEqual([]);
  });
});

describe("운영자가 입력하는 URL", () => {
  it("HTTPS URL은 경로 형태와 관계없이 받는다", () => {
    const sourceUrl = "https://official.example.com/new-board/custom-event-view?id=2026";
    expect(eventFormSchema.parse(form({ sourceUrl })).sourceUrl).toBe(sourceUrl);
  });

  it("공개 화면에 연결할 http URL은 거부한다", () => {
    expect(eventFormSchema.safeParse(form({ sourceUrl: "http://official.example.com/events/2026" })).success).toBe(false);
  });

  it("URL이 아닌 값은 예외 없이 검증 오류로 돌려준다", () => {
    expect(eventFormSchema.safeParse(form({ sourceUrl: "not-a-url" })).success).toBe(false);
  });

  // 허용 프로토콜 전체 목록은 url.test.ts가 원본이다. 여기서는 모든 링크 필드가 그 경계를 쓰는지만 확인한다.
  it.each(["sourceUrl", "applicationUrl", "imageUrl", "organizerUrl"])("%s에 javascript: URL을 넣으면 거부한다", (field) => {
    expect(eventFormSchema.safeParse(form({ [field]: "javascript:alert(1)" })).success).toBe(false);
  });
});

describe("저장 payload", () => {
  it("폼이 다루지 않는 기술 필드는 payload에 넣지 않아 기존 값을 덮어쓰지 않는다", () => {
    const event = eventFormSchema.parse(form({
      latitude: 38.2,
      longitude: 128.59,
      locationSourceUrl: "https://example.com/location",
      locationVerifiedAt: "2026-07-19T14:30",
    }));
    const payload = buildEventPayload(event, VERIFIED_AT);

    for (const key of ["latitude", "longitude", "location_source_url", "location_verified_at", "official_url", "description"]) {
      expect(payload, key).not.toHaveProperty(key);
    }
  });

  it("행사 소개는 summary 하나로 저장하고, 서버 확인 시각을 기록한다", () => {
    const payload = buildEventPayload(eventFormSchema.parse(form({ introduction: "행사 소개" })), VERIFIED_AT);
    expect(payload.summary).toBe("행사 소개");
    expect(payload.last_verified_at).toBe(VERIFIED_AT);
  });

  it("좌표 없이도 주소만으로 저장할 수 있다", () => {
    const event = eventFormSchema.parse(form({ address: "강원특별자치도 속초시" }));
    expect(buildEventPayload(event, VERIFIED_AT).address).toBe("강원특별자치도 속초시");
  });
});

// DB 제약(events_time_order, events_application_order, event_occurrences_unique_start)에 걸릴 입력은
// 저장 전에 이유를 알려 준다. 그대로 보내면 "잠시 후 다시 시도"라는 일반 오류만 나고 다시 해도 성공하지 않는다.
describe("DB 저장 규칙과 같은 입력 검증", () => {
  // 종료가 비면 시작한 날 하루 행사로 계산돼, 여러 날 행사가 다음 날 마감으로 넘어갔다(2026-11-07 양미리축제).
  it("시작이 있는데 종료가 없으면 거부한다", () => {
    const result = eventFormSchema.safeParse(form({ eventEndAt: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "eventEndAt")).toBe(true);
  });

  it("시작과 종료가 모두 없는 초안은 저장할 수 있다", () => {
    expect(eventFormSchema.safeParse(form({ eventStartAt: "", eventEndAt: "" })).success).toBe(true);
  });

  it("시작 없이 종료만 입력하면 거부한다", () => {
    expect(eventFormSchema.safeParse(form({ eventStartAt: "", eventEndAt: "2026-07-20" })).success).toBe(false);
  });

  it("신청 종료가 신청 시작보다 빠르면 거부한다", () => {
    expect(eventFormSchema.safeParse(form({ applicationStartAt: "2026-07-10", applicationEndAt: "2026-07-01" })).success).toBe(false);
  });

  it("같은 시작 시각의 회차가 두 번 있으면 거부한다", () => {
    const result = eventFormSchema.safeParse(form({
      scheduleMode: "occurrences",
      occurrences: [
        { startsAt: "2026-07-22T19:00", endsAt: "" },
        { startsAt: "2026-07-22T19:00", endsAt: "" },
      ],
    }));
    expect(result.success).toBe(false);
  });
});
