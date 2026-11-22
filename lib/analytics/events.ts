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
  // 목록·검색·지도에서 행사나 장소를 골라 상세로 갈 때. 어느 길로 상세에 오는지 보고 그 입구를 키울지 정한다.
  // 장소(place)는 2026-11-21에 더했다: 가볼만한 곳 목록·통합 검색·지도·"다른 곳" 가운데 어디서 장소를 고르는지 본다.
  select_content:
    | {
      content_type: "event";
      content_id: string;
      // place_detail: 즐길거리 상세의 "근처에서 열리는 행사", site_search: 통합 검색 결과(2026-11-21)
      content_source: "event_list" | "related_events" | "popular_events" | "event_map" | "place_detail" | "site_search";
      event_category: string;
    }
    | {
      content_type: "place";
      content_id: string;
      content_source: "place_list" | "site_search" | "similar_places" | "event_map";
      place_category: string;
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
  map_link_clicked: {
    event_slug: string;
    event_category: string;
    link_position: "facts_address";
    map_method: "coordinates" | "search";
  };
  // 행사 상세 아래쪽의 관련 행사 목록 노출(2026-11-07). 관련 행사 클릭률의 분모다.
  related_events_viewed: {
    event_category: string;
  };
  // 지도 탭(/map)에서 장소 핀을 눌러 그 장소의 행사를 열었을 때(2026-11-16). 지도에서 카드를 누른 것은 select_content(event_map)로 센다.
  map_place_selected: {
    map_category: string;
    event_count: number;
    // pin: 지도 핀, list: md 이상 왼쪽 목록 판(2026-11-21). 목록 판을 남길지 정하는 근거다.
    select_method: "pin" | "list";
  };
  // 지도 분야 칩으로 분야를 실제로 바꿨을 때. 칩을 남길지 정하는 근거다(2026-11-16). "전체"로 돌아가면 all.
  map_category_changed: {
    map_category: string;
  };
  // 지도 대신 "지금은 지도를 볼 수 없어요"를 보여 줄 때 한 번. 운영에서 키를 빠뜨리거나 주소 등록이 틀리면 조용히 죽어 있어서 센다(2026-11-16).
  map_unavailable: {
    reason: "missing_key" | "auth_failed" | "script_error";
  };
  // 통합 검색(/search) 결과가 그려질 때(2026-11-21). 검색어 원문은 보내지 않는다. 결과 0건 비율로 데이터가 모자란 곳을 찾는다.
  site_search_viewed: {
    query_length: number;
    event_count: number;
    place_count: number;
  };
  // 가볼만한 곳의 지역 select로 지역을 실제로 바꿨을 때(2026-11-22). 고성·양양 명소를 더 넓힐지, 기본 지역을 속초로 둘지 정하는 근거다.
  // region: 고른 값(sokcho·goseong·yangyang·all), surface: 가볼만한 곳 목록·통합 검색. 지도는 지역으로 거르지 않는다(2026-11-22 사용자 결정).
  place_region_changed: {
    region: string;
    surface: "place_list" | "site_search";
  };
  // 즐길거리 상세(/places/[slug])가 처음 표시될 때(2026-11-21). 즐길거리 메뉴를 넓힐지 줄일지의 기준이다.
  place_detail_viewed: {
    place_slug: string;
    place_category: string;
    // 장소의 지역(sokcho·goseong·yangyang, 2026-11-22). 고성·양양 장소 상세 조회를 slug 없이 나눠 보려고 더했다.
    place_region: string;
  };
  // 즐길거리 상세에서 공식 홈페이지·예매·지도로 나갈 때. place_detail_viewed 대비 비율로 상세가 쓸모 있는지 본다.
  place_link_clicked: {
    place_slug: string;
    place_category: string;
    link_type: "official" | "booking" | "map";
  };
  // 상세 포스터 크게 보기를 열었을 때(2026-11-18). 여러 장 갤러리를 만들지 정하는 근거다.
  poster_viewed: {
    event_slug: string;
    event_category: string;
  };
  share: {
    method: "native_share_sheet" | "link_copy";
    content_type: "event";
    item_id: string;
  };
  // 헤더 아래 공지 띠가 보였을 때(viewed, 페이지를 처음 열 때 한 번), 눌러 공지 글로 가거나(clicked) 닫았을 때(dismissed).
  // 띠가 읽히는지, 거슬리기만 하는지 본다. viewed는 비율의 분모다: 닫은 방문자는 띠가 숨겨져 세지 않는다(2026-11-22).
  notice_banner_viewed: {
    notice_id: string;
    notice_kind: string;
  };
  notice_banner_clicked: {
    notice_id: string;
    notice_kind: string;
  };
  notice_banner_dismissed: {
    notice_id: string;
    notice_kind: string;
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
  sort_changed: true,
  status_tab_changed: true,
  application_link_clicked: true,
  source_link_clicked: true,
  map_link_clicked: true,
  related_events_viewed: true,
  map_place_selected: true,
  map_category_changed: true,
  map_unavailable: true,
  place_detail_viewed: true,
  place_region_changed: true,
  site_search_viewed: true,
  place_link_clicked: true,
  poster_viewed: true,
  share: true,
  notice_banner_viewed: true,
  notice_banner_clicked: true,
  notice_banner_dismissed: true,
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
