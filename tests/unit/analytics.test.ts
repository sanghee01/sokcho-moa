import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyticsData,
  isAnalyticsEvent,
  parseAnalyticsProperties,
  trackAnalyticsAttributes,
  trackAnalyticsEvent,
  trackPageView,
} from "@/lib/analytics/events";
import {
  shouldCollectGoogleAnalytics,
  shouldTrackGoogleAnalyticsPage,
} from "@/lib/analytics/google-analytics";
import { INTERNAL_TRAFFIC_STORAGE_KEY, markInternalTraffic } from "@/lib/analytics/internal-traffic";

describe("analytics event contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 2026-11-07 이벤트마다 파라미터 타입을 정하면서 select_content는 event_category가 필수가 됐다(사용자 승인).
  // 빈 값을 버리는 확인은 타입 검사를 거치지 않는 화면 속성 경로(parseAnalyticsProperties) test로 옮겼다.
  it("정의된 이벤트와 분석 가능한 값만 DOM 속성으로 직렬화한다", () => {
    const attributes = analyticsData("select_content", {
      content_type: "event",
      content_id: "demo-sea-family-festival",
      content_source: "event_list",
      event_category: "festival",
    });

    expect(attributes["data-analytics-event"]).toBe("select_content");
    expect(parseAnalyticsProperties(attributes["data-analytics-properties"])).toEqual({
      content_type: "event",
      content_id: "demo-sea-family-festival",
      content_source: "event_list",
      event_category: "festival",
    });
  });

  it("깨진 데이터 속성은 이벤트 수집을 방해하지 않고 빈 파라미터로 처리한다", () => {
    expect(parseAnalyticsProperties("{broken-json")).toEqual({});
    expect(parseAnalyticsProperties("[]")).toEqual({});
  });

  it("화면 속성에서 읽은 값 중 비어 있거나 분석할 수 없는 값은 버린다", () => {
    expect(parseAnalyticsProperties(JSON.stringify({
      status_tab: "closed",
      empty: null,
      nested: { value: 1 },
    }))).toEqual({ status_tab: "closed" });
  });

  it("정해 둔 이벤트 이름만 화면 속성 이벤트로 받는다", () => {
    expect(isAnalyticsEvent("status_tab_changed")).toBe(true);
    expect(isAnalyticsEvent("nearby_places_viewed")).toBe(true);
    // 2026-11-06에 없앤 이벤트와 객체 기본 속성 이름은 받지 않는다.
    expect(isAnalyticsEvent("filter_used")).toBe(false);
    expect(isAnalyticsEvent("toString")).toBe(false);
    expect(isAnalyticsEvent(undefined)).toBe(false);
  });

  it("코드에서 보내는 이벤트는 이벤트마다 정한 파라미터를 그대로 GA4에 전송한다", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackAnalyticsEvent("search_results_viewed", { result_count: 0, query_length: 3, status_tab: "active" });
    trackAnalyticsEvent("feedback_submitted", {});

    expect(gtag).toHaveBeenCalledWith("event", "search_results_viewed", {
      result_count: 0,
      query_length: 3,
      status_tab: "active",
    });
    expect(gtag).toHaveBeenCalledWith("event", "feedback_submitted", {});
  });

  it("화면 속성에서 읽은 이벤트는 빈 값을 버리고 GA4에 전송한다", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackAnalyticsAttributes("status_tab_changed", { status_tab: "closed", empty: null });

    expect(gtag).toHaveBeenCalledWith("event", "status_tab_changed", { status_tab: "closed" });
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

  it("page_view 주소에 담긴 검색어(q)는 GA로 보내기 전에 가린다", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackPageView({
      page_title: "속초모아",
      page_location: `https://sokchomoa.com/?q=${encodeURIComponent("홍길동")}&sort=views`,
      page_referrer: "https://sokchomoa.com/topics/festival?q=010-1234-5678",
    });

    expect(gtag).toHaveBeenCalledWith("event", "page_view", {
      page_title: "속초모아",
      page_location: "https://sokchomoa.com/?q=%28redacted%29&sort=views",
      page_referrer: "https://sokchomoa.com/topics/festival?q=%28redacted%29",
    });
  });
});

describe("internal traffic marker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("관리자 화면에 들어온 기기를 기억하고 GA 이벤트에 내부 트래픽 표시를 붙인다", () => {
    const gtag = vi.fn();
    const setItem = vi.fn();
    vi.stubGlobal("window", { gtag, localStorage: { setItem } });

    markInternalTraffic();

    expect(setItem).toHaveBeenCalledWith(INTERNAL_TRAFFIC_STORAGE_KEY, "1");
    expect(gtag).toHaveBeenCalledWith("set", { traffic_type: "internal" });
  });

  it("저장소를 막은 브라우저에서도 지금 화면의 GA 이벤트에는 표시를 붙인다", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", {
      gtag,
      localStorage: {
        setItem: () => {
          throw new Error("storage blocked");
        },
      },
    });

    expect(() => markInternalTraffic()).not.toThrow();
    expect(gtag).toHaveBeenCalledWith("set", { traffic_type: "internal" });
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
    expect(shouldTrackGoogleAnalyticsPage("/administrator")).toBe(true);
  });
});
