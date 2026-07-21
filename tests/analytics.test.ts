import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsData, parseAnalyticsProperties, trackPageView } from "@/lib/analytics/events";
import {
  shouldCollectGoogleAnalytics,
  shouldTrackGoogleAnalyticsPage,
} from "@/lib/analytics/google-analytics";

describe("analytics event contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("SPA 화면 조회를 GA4 표준 page_view 이벤트로 전송한다", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackPageView({
      page_title: "워터밤 속초 2026 | 속초모아",
      page_location: "https://sokcho-moa.vercel.app/events/waterbomb-sokcho-2026",
      page_referrer: "https://sokcho-moa.vercel.app/",
    });

    expect(gtag).toHaveBeenCalledOnce();
    expect(gtag).toHaveBeenCalledWith("event", "page_view", {
      page_title: "워터밤 속초 2026 | 속초모아",
      page_location: "https://sokcho-moa.vercel.app/events/waterbomb-sokcho-2026",
      page_referrer: "https://sokcho-moa.vercel.app/",
    });
  });
});

describe("Google Analytics collection environment", () => {
  it("Vercel 운영 배포에서만 외부 수집을 활성화한다", () => {
    expect(shouldCollectGoogleAnalytics("production")).toBe(true);
    expect(shouldCollectGoogleAnalytics("preview")).toBe(false);
    expect(shouldCollectGoogleAnalytics("development")).toBe(false);
    expect(shouldCollectGoogleAnalytics(undefined)).toBe(false);
  });

  it("관리자와 E2E 전용 화면은 공개 서비스 페이지뷰에서 제외한다", () => {
    expect(shouldTrackGoogleAnalyticsPage("/")).toBe(true);
    expect(shouldTrackGoogleAnalyticsPage("/events/waterbomb-sokcho-2026")).toBe(true);
    expect(shouldTrackGoogleAnalyticsPage("/admin")).toBe(false);
    expect(shouldTrackGoogleAnalyticsPage("/admin/events/123")).toBe(false);
    expect(shouldTrackGoogleAnalyticsPage("/e2e-test/admin-status")).toBe(false);
    expect(shouldTrackGoogleAnalyticsPage("/administrator")).toBe(true);
  });
});
