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
| `select_content` | 목록·관련 행사·많이 보는 행사에서 행사를 선택할 때 | `content_type`, `content_id`, `content_source`(`event_list`, `related_events`, `popular_events`), `event_category` | 상세 진입 출처 |
| `search_submitted` | 키워드 검색을 제출할 때 | `query_length`, `has_query`, `active_filter_count` | 검색 사용성. 검색어 원문은 전송하지 않음 |
| `sort_changed` | 정렬 칩으로 정렬 기준을 실제로 변경할 때 | `sort_method`(`latest` 행사일순·기본, `views` 조회순) | 정렬 선호도. 2026-11-06 기본을 `published`에서 `latest`로 바꾸고 `published`·`deadline` 칩을 뺐으므로 그 전후 값을 따로 본다. |
| `application_link_clicked` | 신청·예매 링크를 선택할 때 | `event_slug`, `event_category`, `link_position` | 핵심 전환 프록시 |
| `source_link_clicked` | 공식 원문·안내 링크를 선택할 때 | `event_slug`, `event_category`, `link_position`, `source_type` | 정보 검증·참여 의도 |
| `map_link_clicked` | 행사 또는 주변 명소 지도를 선택할 때 | `event_slug` 또는 `place_name`, `link_position`, `map_method` | 방문 의도 |
| `nearby_place_clicked` | 주변 명소 공식 페이지를 선택할 때 | `place_name`, `place_category`, `link_position` | 주변 콘텐츠 활용 |
| `share` | 네이티브 공유 또는 링크 복사가 성공했을 때 | `method`, `content_type`, `item_id` | 추천·확산 |

`share`와 `select_content`는 GA4 권장 이벤트명을 사용한다. 기존 커스텀 이벤트명은 과거 데이터와의 연속성을 위해 유지했다.

2026-11-06 상세 개편으로 신청·예매와 행사 안내 버튼이 하단 행동 바 하나로 모였다. 두 이벤트의 `link_position`은 그 전 `hero`에서 `action_bar`로 바뀌었다.

2026-11-06 디자인 개편에서 빠른 필터를 없애며 `filter_used`·`filter_reset`(파라미터 `filter_type`·`filter_value`·`filter_action`)을 더 이상 보내지 않는다. 그 전 데이터는 GA4에 남아 있다.

## GA4 관리자 설정

`page_view`는 코드가 직접 보낸다(`components/analytics/analytics-runtime.tsx`). 첫 로드의 자동 전송은 `send_page_view: false`로 끄고,
경로(pathname)가 바뀔 때마다 한 번 보낸다. 이렇게 하는 이유는 관리자 화면(`/admin`)을 집계에서 빼고 이전 화면을 `page_referrer`로 남기기 위해서다.
검색어·필터·정렬처럼 쿼리만 바뀌는 이동은 `page_view`가 아니라 `search_submitted`, `filter_used`, `sort_changed`로 센다.

따라서 웹 데이터 스트림의 Enhanced Measurement에서 **`Page changes based on browser history events`를 꺼야 한다.**
`send_page_view: false`는 첫 로드의 자동 page_view만 끄고, 이 옵션이 켜져 있으면 history 변경마다 page_view가 따로 나가
공개 화면은 두 번, 관리자 화면은 집계 제외 없이 기록된다([Google: Measure single-page applications](https://developers.google.com/analytics/devguides/collection/ga4/views)).

아래 저카디널리티 파라미터를 이벤트 범위 Custom dimension으로 우선 등록한다.

- `event_category`
- `content_source`
- `link_position`
- `sort_method`
- `source_type`
- `map_method`
- `application_available`

`event_slug`, `place_name`, 날짜처럼 값 종류가 계속 늘어나는 항목은 필요한 탐색 보고서에서만 사용한다. 불필요한 Custom dimension 등록은 `(other)` 행 증가와 할당량 낭비를 만든다.

Enhanced Measurement의 사이트 검색은 기본적으로 `q` 값을 `search_term`으로 수집할 수 있다. 검색어 원문 수집이 필요 없다면 GA4 관리자에서 Site search 측정을 끈다. 애플리케이션의 `search_submitted` 이벤트는 개인정보 가능성을 줄이기 위해 검색어 길이와 검색 여부만 전송한다.

배포 후 Realtime과 DebugView에서 이벤트명, 중복 발생 여부, 파라미터 값을 확인한다. 특히 한 번의 상세 진입에 `event_detail_viewed`가 한 번만 발생하는지 확인한다.

참고: [GA4 권장 이벤트](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events), [이벤트 파라미터 설정](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061)
