# 속초모아 GA4 측정 설계

## 측정 목표

속초모아의 핵심 가치는 사용자가 흩어진 행사 정보를 탐색하고 실제 참여 판단에 필요한 공식 정보로 이동하는 데 있다. 따라서 클릭 수 자체보다 아래 세 흐름을 우선 측정한다.

1. 탐색 효율: 목록·캘린더에서 행사 상세까지 도달하는가
2. 참여 의도: 상세 확인 뒤 신청·예매 또는 공식 원문으로 이동하는가
3. 활용 가치: 지도 확인과 행사 공유가 일어나는가

추천 핵심 지표는 `상세 탐색률`, `참여 의도 전환율`, `공유·지도 활용률`이다. GA4의 Key event는 실제 전환에 가장 가까운 `application_link_clicked`를 우선 지정한다. 신청 링크가 없는 행사가 많다면 `source_link_clicked`를 별도 보조 전환으로 본다.

## 이벤트 계약

| 이벤트 | 발생 시점 | 주요 파라미터 | 역할 |
| --- | --- | --- | --- |
| `event_detail_viewed` | 행사 상세가 처음 표시될 때 | `event_slug`, `event_category`, `event_audiences`, `application_available` | 상세 탐색 도달 |
| `select_content` | 목록·관련 행사·캘린더에서 행사를 선택할 때 | `content_type`, `content_id`, `content_source`, `event_category` | 상세 진입 출처 |
| `search_submitted` | 키워드 검색을 제출할 때 | `query_length`, `has_query`, `active_filter_count` | 검색 사용성. 검색어 원문은 전송하지 않음 |
| `filter_used` | 필터를 적용하거나 해제할 때 | `filter_type`, `filter_value`, `filter_action` | 탐색 조건 수요 |
| `filter_reset` | 적용된 필터를 초기화할 때 | `active_filter_count` | 탐색 실패·재시도 신호 |
| `sort_changed` | 정렬 기준을 실제로 변경할 때 | `sort_method` | 정렬 선호도 |
| `calendar_month_changed` | 이전·이번·다음 달로 이동할 때 | `direction`, `target_month` | 캘린더 탐색 깊이 |
| `calendar_date_selected` | 모바일 캘린더 날짜를 선택할 때 | `selected_date`, `event_count` | 날짜 탐색 사용성 |
| `application_link_clicked` | 신청·예매 링크를 선택할 때 | `event_slug`, `event_category`, `link_position` | 핵심 전환 프록시 |
| `source_link_clicked` | 공식 원문·안내 링크를 선택할 때 | `event_slug`, `event_category`, `link_position`, `source_type` | 정보 검증·참여 의도 |
| `map_link_clicked` | 행사 또는 주변 명소 지도를 선택할 때 | `event_slug` 또는 `place_name`, `link_position`, `map_method` | 방문 의도 |
| `nearby_place_clicked` | 주변 명소 공식 페이지를 선택할 때 | `place_name`, `place_category`, `link_position` | 주변 콘텐츠 활용 |
| `share` | 네이티브 공유 또는 링크 복사가 성공했을 때 | `method`, `content_type`, `item_id` | 추천·확산 |

`share`와 `select_content`는 GA4 권장 이벤트명을 사용한다. 기존 커스텀 이벤트명은 과거 데이터와의 연속성을 위해 유지했다.

## GA4 관리자 설정

이 코드는 GA4 Enhanced Measurement의 자동 `page_view`를 전제로 한다. 웹 데이터 스트림에서 `Page changes based on browser history events`가 켜져 있는지 확인하고, 별도의 수동 `page_view` 태그를 중복으로 만들지 않는다.

아래 저카디널리티 파라미터를 이벤트 범위 Custom dimension으로 우선 등록한다.

- `event_category`
- `content_source`
- `link_position`
- `filter_type`
- `filter_value`
- `filter_action`
- `sort_method`
- `source_type`
- `map_method`
- `application_available`

`event_slug`, `place_name`, 날짜처럼 값 종류가 계속 늘어나는 항목은 필요한 탐색 보고서에서만 사용한다. 불필요한 Custom dimension 등록은 `(other)` 행 증가와 할당량 낭비를 만든다.

Enhanced Measurement의 사이트 검색은 기본적으로 `q` 값을 `search_term`으로 수집할 수 있다. 검색어 원문 수집이 필요 없다면 GA4 관리자에서 Site search 측정을 끈다. 애플리케이션의 `search_submitted` 이벤트는 개인정보 가능성을 줄이기 위해 검색어 길이와 검색 여부만 전송한다.

배포 후 Realtime과 DebugView에서 이벤트명, 중복 발생 여부, 파라미터 값을 확인한다. 특히 한 번의 상세 진입에 `event_detail_viewed`가 한 번만 발생하는지 확인한다.

참고: [GA4 권장 이벤트](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events), [이벤트 파라미터 설정](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061)
