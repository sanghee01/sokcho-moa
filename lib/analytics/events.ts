/** 목록의 진행중·마감 탭. 탭 전환과 검색 결과 이벤트가 함께 쓴다. */
export type AnalyticsStatusTab = "active" | "closed";

/**
 * GA4 이벤트마다 보내는 파라미터. docs/analytics-events.md의 이벤트 계약 표와 1:1로 맞춘다.
 * 이름이나 파라미터를 틀리면 typecheck에서 걸리도록 이벤트마다 타입을 정했다(2026-11-07 사용자 결정).
 * lib은 도메인 타입을 import하지 않으므로 행사 분야·명소 분류·정렬 값은 문자열로 둔다.
 */
export interface AnalyticsEventParams {
  event_detail_viewed: {
    event_slug: string;
    event_category: string;
    // 참여 대상 여러 개를 "|"로 이은 값
    event_audiences: string;
    application_available: boolean;
  };
  select_content: {
    content_type: "event";
    content_id: string;
    content_source: "event_list" | "related_events" | "popular_events";
    event_category: string;
  };
  search_submitted: {
    query_length: number;
    has_query: boolean;
    active_filter_count: number;
  };
  search_results_viewed: {
    result_count: number;
    query_length: number;
    status_tab: AnalyticsStatusTab;
  };
  sort_changed: {
    sort_method: string;
  };
  status_tab_changed: {
    status_tab: AnalyticsStatusTab;
  };
  application_link_clicked: {
    event_slug: string;
    event_category: string;
    link_position: "action_bar";
  };
  source_link_clicked: {
    event_slug: string;
    event_category: string;
    link_position: "action_bar";
    source_type: "primary";
  };
  map_link_clicked:
    | {
      event_slug: string;
      event_category: string;
      link_position: "facts_address";
      map_method: "coordinates" | "search";
    }
    | {
      content_type: "nearby_place";
      place_name: string;
      link_position: "nearby_place_card";
    };
  nearby_places_viewed: {
    event_category: string;
  };
  // 명소 클릭률과 비교하는 기준. 같은 상세 아래쪽의 관련 행사 목록 노출(2026-11-07)
  related_events_viewed: {
    event_category: string;
  };
  nearby_place_clicked: {
    place_name: string;
    place_category: string;
    link_position: "nearby_place_card";
  };
  share: {
    method: "native_share_sheet" | "link_copy";
    content_type: "event";
    item_id: string;
  };
  // 제보·의견 내용에는 개인정보가 섞일 수 있어 파라미터를 보내지 않는다.
  event_report_submitted: Record<string, never>;
  feedback_submitted: Record<string, never>;
}

export type AnalyticsEvent = keyof AnalyticsEventParams;

// 클릭 위임(analytics-runtime)이 화면 속성에서 읽은 이름을 실행 중에 확인하는 표.
// satisfies 덕분에 위 파라미터 표와 이벤트가 하나라도 어긋나면 타입 오류가 난다.
const analyticsEventNames = {
  event_detail_viewed: true,
  select_content: true,
  search_submitted: true,
  search_results_viewed: true,
  sort_changed: true,
  status_tab_changed: true,
  application_link_clicked: true,
  source_link_clicked: true,
  map_link_clicked: true,
  nearby_places_viewed: true,
  related_events_viewed: true,
  nearby_place_clicked: true,
  share: true,
  event_report_submitted: true,
  feedback_submitted: true,
} satisfies Record<AnalyticsEvent, true>;

/** 화면의 data-analytics-event 값이 정해 둔 이벤트 이름인지. 검사와 함께 타입을 좁혀 `as` 캐스팅을 쓰지 않는다. */
export function isAnalyticsEvent(value: string | undefined): value is AnalyticsEvent {
  return Object.keys(analyticsEventNames).some((event) => event === value);
}
export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
export interface PageViewProperties {
  page_title: string;
  page_location: string;
  page_referrer?: string;
}
export interface AnalyticsDataAttributes {
  "data-analytics-event": AnalyticsEvent;
  "data-analytics-properties"?: string;
}

/** 이 사이트가 쓰는 gtag 명령. set은 그 뒤 모든 이벤트에 붙는 값(운영자 표시)에 쓴다. */
interface GoogleTag {
  (command: "event", name: string, properties?: AnalyticsProperties): void;
  (command: "set", properties: AnalyticsProperties): void;
}

declare global {
  interface Window {
    gtag?: GoogleTag;
  }
}

/** 코드에서 직접 보내는 이벤트. 파라미터는 이벤트마다 정한 타입을 따라야 한다. */
export function trackAnalyticsEvent<T extends AnalyticsEvent>(name: T, properties: AnalyticsEventParams[T]) {
  sendAnalyticsEvent(name, properties);
}

/**
 * 클릭 위임(analytics-runtime)이 화면 속성(data-analytics-*)에서 읽은 이벤트를 보낸다.
 * 속성은 analyticsData로 만들 때 이미 타입 검사를 거쳤고, 실행 중에는 이벤트 이름만 다시 확인한다.
 */
export function trackAnalyticsAttributes(name: AnalyticsEvent, properties: AnalyticsProperties) {
  sendAnalyticsEvent(name, properties);
}

export function trackPageView(properties: PageViewProperties) {
  if (typeof window === "undefined") return;
  // interface는 index signature가 없어 Record로 바로 넘길 수 없다. 펼쳐서 일반 객체로 넘긴다.
  window.gtag?.("event", "page_view", compactProperties({
    ...properties,
    page_location: redactQueryParams(properties.page_location),
    page_referrer: redactQueryParams(properties.page_referrer),
  }));
}

// 검색어(q)에는 이름·전화번호가 섞일 수 있어 GA로 보내기 전에 값을 가린다. Google은 URL에 개인정보를 넣지 말라고 한다.
// GA 관리자 "데이터 수정"에도 q를 넣었지만, 코드에서 가려야 E2E로 확인할 수 있다(2026-11-07).
const REDACTED_QUERY_PARAMS = ["q"];
const REDACTED_QUERY_VALUE = "(redacted)";

function redactQueryParams(value: string | undefined) {
  if (value === undefined) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  const names = REDACTED_QUERY_PARAMS.filter((name) => url.searchParams.has(name));
  if (names.length === 0) return value;
  for (const name of names) url.searchParams.set(name, REDACTED_QUERY_VALUE);
  return url.toString();
}

export function analyticsData<T extends AnalyticsEvent>(name: T, properties: AnalyticsEventParams[T]): AnalyticsDataAttributes {
  const compacted = compactProperties(properties);
  return {
    "data-analytics-event": name,
    ...(Object.keys(compacted).length > 0
      ? { "data-analytics-properties": JSON.stringify(compacted) }
      : {}),
  };
}

export function parseAnalyticsProperties(value: string | undefined): AnalyticsProperties {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return compactProperties(parsed as AnalyticsProperties);
  } catch {
    return {};
  }
}

function sendAnalyticsEvent(name: AnalyticsEvent, properties: AnalyticsProperties) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, compactProperties(properties));
}

function compactProperties(properties: AnalyticsProperties): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      value !== undefined
      && value !== null
      && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    )),
  );
}
