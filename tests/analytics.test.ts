import { describe, expect, it } from "vitest";
import { analyticsData, parseAnalyticsProperties } from "@/lib/analytics/events";

describe("analytics event contract", () => {
  it("정의된 이벤트와 분석 가능한 값만 DOM 속성으로 직렬화한다", () => {
    const attributes = analyticsData("filter_used", {
      filter_type: "audience",
      filter_value: "family",
      filter_action: "apply",
      omitted: undefined,
      empty: null,
    });

    expect(attributes["data-analytics-event"]).toBe("filter_used");
    expect(parseAnalyticsProperties(attributes["data-analytics-properties"])).toEqual({
      filter_type: "audience",
      filter_value: "family",
      filter_action: "apply",
    });
  });

  it("깨진 데이터 속성은 이벤트 수집을 방해하지 않고 빈 파라미터로 처리한다", () => {
    expect(parseAnalyticsProperties("{broken-json")).toEqual({});
    expect(parseAnalyticsProperties("[]")).toEqual({});
  });
});
