# 속초모아 GA4 측정 설계

## 측정 목표

속초모아의 핵심 가치는 사용자가 흩어진 행사 정보를 찾아 실제 참여 판단에 필요한 공식 정보로 이동하는 데 있다. 클릭 수 자체보다 아래 네 흐름을 측정한다.

1. 탐색: 방문자 대부분은 네이버 검색에서 상세로 바로 들어온다(2026-07-01~11-06 상세 조회 사용자가 전체 사용자의 81.6%). 그래서 둘로 나눠 본다.
   - 목록으로 들어온 사용자가 상세까지 도달하는가
   - 상세로 들어온 사용자가 다른 행사로 이어 가는가(`select_content`의 `related_events`·`event_list`). "한 번 보고 떠난다"를 직접 재는 지표다
2. 참여 의도: 상세 확인 뒤 공식 원문이나 신청·예매로 이동하는가
3. 활용: 지도, 공유, 주변 명소를 쓰는가
4. 재방문: 다시 오는가. 알림(웹 푸시) 계획의 성공 기준이다. 지표는 28일 안 재방문 사용자 비율, 첫 방문 주별 코호트의 1주·4주 재방문율, DAU/MAU다

GA4 주요 이벤트(Key event)는 `application_link_clicked`(2026-10-25 지정)와 `source_link_clicked`(2026-11-07 지정)다.
신청 링크가 있는 행사는 일부라 원문 클릭을 함께 지정해야 유입 채널별 비교가 된다. 기본으로 들어 있는 `purchase`는 GA가 해제를 막아 두었고 데이터가 없다.
주요 이벤트는 지정한 때부터만 센다.

## 이벤트 계약

| 이벤트 | 발생 시점 | 주요 파라미터 | 역할 |
| --- | --- | --- | --- |
| `event_detail_viewed` | 행사 상세가 처음 표시될 때 | `event_slug`, `event_category`, `event_audiences`, `application_available` | 상세 도달 |
| `select_content` | 목록·관련 행사·많이 보는 행사에서 행사를 선택할 때 | `content_type`, `content_id`, `content_source`(`event_list`, `related_events`, `popular_events`), `event_category` | 상세 진입 출처, 상세에서 다른 행사로 이어 가는지 |
| `search_submitted` | 키워드 검색을 제출할 때 | `query_length`, `has_query`, `active_filter_count` | 검색 사용성. 검색어 원문은 전송하지 않음 |
| `sort_changed` | 정렬 칩으로 정렬 기준을 실제로 변경할 때 | `sort_method`(`latest` 행사일순·기본, `views` 조회순) | 정렬 선호도. 2026-11-06 기본을 `published`에서 `latest`로 바꾸고 `published`·`deadline` 칩을 뺐으므로 그 전후 값을 따로 본다. |
| `application_link_clicked` | 신청·예매 링크를 선택할 때 | `event_slug`, `event_category`, `link_position` | 주요 이벤트. 참여 의도 |
| `source_link_clicked` | 공식 원문·안내 링크를 선택할 때 | `event_slug`, `event_category`, `link_position`, `source_type` | 주요 이벤트. 정보 검증·참여 의도 |
| `map_link_clicked` | 행사 또는 주변 명소 지도를 선택할 때 | `event_slug` 또는 `place_name`, `link_position`, `map_method` | 방문 의도 |
| `nearby_place_clicked` | 주변 명소 공식 페이지를 선택할 때 | `place_name`, `place_category`, `link_position` | 주변 콘텐츠 활용 |
| `share` | 네이티브 공유 또는 링크 복사가 성공했을 때 | `method`, `content_type`, `item_id` | 추천·확산 |
| `search_results_viewed` | 검색어가 있는 목록이 그려질 때. 같은 분야·탭·검색어에서 정렬만 바꾼 것은 다시 세지 않는다 | `result_count`, `query_length`, `status_tab` | 결과 0건 검색 비율. 검색 개선·행사 보강이 필요한지 |
| `status_tab_changed` | 목록의 진행중·마감 탭을 눌러 실제로 바꿀 때. 이미 선택된 탭은 세지 않는다 | `status_tab`(`active` 진행중, `closed` 마감) | 마감 행사를 찾는 수요. 마감 탭을 계속 둘지 |
| `nearby_places_viewed` | 행사 상세의 주변 명소 카드 목록이 화면 아래쪽 4분의 1을 뺀 영역에 처음 들어왔을 때. 상세 화면마다 한 번 | `event_category` | 명소 기능을 남길지. 본 사람 대비 클릭률의 분모 |
| `related_events_viewed` | 같은 상세 아래쪽의 "이 행사도 살펴보세요" 목록이 같은 조건으로 화면에 들어왔을 때 | `event_category` | 명소 클릭률과 비교하는 기준. 아래까지 내려온 사람이 무엇을 누르는지 |
| `event_report_submitted` | 행사 제보가 서버에 접수돼 완료 화면이 보일 때. 입력 오류·서버 오류는 세지 않는다 | 없음 | 제보 완료율(아래 판단 규칙). 제보 폼을 줄일지 |
| `feedback_submitted` | 의견 보내기가 서버에 접수돼 완료 화면이 보일 때 | 없음 | 위와 같음(의견 창구) |

파라미터 이름과 값의 원본은 `lib/analytics/events.ts`의 `AnalyticsEventParams`다. 이벤트 이름이나 파라미터를 틀리면 `pnpm typecheck`에서 걸린다(2026-11-07 사용자 결정).
이 표는 언제 보내고 무엇을 정하려고 세는지를 적는다. 정할 일이 없는 이벤트는 만들지 않는다.

`share`와 `select_content`는 GA4 권장 이벤트명을 사용한다. 기존 커스텀 이벤트명은 과거 데이터와의 연속성을 위해 유지했다.
검색은 권장 이벤트 `search`가 검색어(`search_term`)를 필수로 받아 쓰지 않는다.

2026-11-06 상세 개편으로 신청·예매와 행사 안내 버튼이 하단 행동 바 하나로 모였다. 두 이벤트의 `link_position`은 그 전 `hero`에서 `action_bar`로 바뀌었다.

2026-11-06 디자인 개편에서 빠른 필터를 없애며 `filter_used`·`filter_reset`(파라미터 `filter_type`·`filter_value`·`filter_action`)을 더 이상 보내지 않는다. 그 전 데이터는 GA4에 남아 있다.

### 2026-11-07에 더한 이벤트

2026-11-07 점검에서 측정이 비어 있던 곳(검색 결과 수, 진행중·마감 탭, 주변 명소·관련 행사 노출, 제보·의견 접수)에 이벤트를 더했다.

- 이름은 기존 이벤트처럼 `대상_동작`(소문자와 밑줄)으로 짓는다.
- 제출 성공을 직접 보내는 이유: GA4 향상된 측정에도 `form_submit`이 있지만 이 사이트에서는 2026-07-01~11-06에 한 번도 기록되지 않았고(같은 기간 `form_start` 89회),
  기록되더라도 입력 오류로 실패한 제출까지 센다. 자동 이벤트와 헷갈리지 않게 이름도 폼마다 따로 짓는다.
- 제보·의견의 제목·본문·링크와 검색어 원문은 보내지 않는다. 그래서 0건 검색이 많아도 무엇을 찾았는지는 알 수 없다. 검색어 수집은 개인정보 판단이 필요해 뺐다.
- 검색은 2026-07-01~11-06에 73회뿐이라 `search_results_viewed`는 몇 달 쌓인 뒤에 본다.

## 판단 규칙

숫자를 보기 전에 무엇으로 판단할지 정해 둔다. 모두 운영자 방문을 뺀 사용자 수로 계산하고, 분모 사용자 수를 함께 적는다.

| 판단 | 계산 | 기준 |
| --- | --- | --- |
| 주변 명소를 남길지 | `nearby_places_viewed` 사용자 중 `nearby_place_clicked` 또는 (`map_link_clicked`이고 `link_position` = `nearby_place_card`) 사용자의 비율 | 노출 사용자 1,000명이 모인 뒤 2% 미만이면 삭제를 검토한다(2026-11-07 사용자 결정). 같은 기간 `related_events_viewed` 대비 관련 행사 `select_content` 비율과 함께 본다 |
| 제보·의견 폼을 줄일지 | `/report`의 `page_view` → 같은 경로의 `form_start` → `event_report_submitted`(의견은 `/feedback`, `feedback_submitted`) | 검색창도 `<form>`이라 `form_start`가 생기므로 반드시 페이지 경로로 거른다 |
| 검색을 고칠지 | `search_results_viewed` 중 `result_count` = 0 비율 | 높게 나오면 검색어 수집 여부를 다시 정한다 |
| 마감 탭을 둘지 | 목록 `page_view` 사용자 중 `status_tab_changed`(`closed`) 사용자 비율 | 몇 달 쌓인 뒤 본다 |

비율이 1~5%인 지표는 노출 1,000명에서도 95% 범위가 ±1%p 안팎이다. 클릭이 10건 안팎일 때는 판단을 미룬다.
행사 수가 계절마다 달라, 축제가 몰린 달 하나로 판단하지 않고 같은 길이의 기간끼리 비교한다.

## 데이터를 읽을 때 주의할 날짜

| 값 | 믿을 수 있는 시작 | 이유 |
| --- | --- | --- |
| page_view 기반(조회수, 사용자당 조회, 페이지 경로·이전 화면) | 2026-11-07 | 2026-07-21부터 코드가 page_view를 보냈는데, 2026-11-06 20:44까지 향상된 측정의 "브라우저 기록 기반 페이지 변경"도 켜져 있어 사이트 안 이동이 두 번 기록됐다. 관리자 화면도 이때 자동 page_view로 들어갔다 |
| 상세 조회(`event_detail_viewed`)와 링크 클릭 | 2026-07 | 자동 page_view의 영향을 받지 않는다. 단 운영자 방문이 섞여 있다 |
| 주요 이벤트 수·비율 | 2026-10-25(신청), 2026-11-07(원문) | 지정한 때부터 센다 |
| 맞춤 측정기준으로 나눈 값 | 2026-11-07 | 그때 등록했다. 그 전 데이터에도 붙는지는 Google 문서에 없다 |
| 신규·재방문 사용자 | 2026-11-07 | `sokchomoa.com` 이전. GA 쿠키는 도메인마다 따로라 예전 방문자도 새 주소에서는 신규로 잡힌다 |
| 탐색 분석에 쓸 수 있는 가장 오래된 날짜 | 약 2026-09 초 | 2026-11-07 전 이벤트 데이터 보관이 2개월이었고, 늘려도 지운 데이터는 돌아오지 않는다 |

과거 데이터로 탐색 분석을 만들 때는 페이지 경로가 `/admin`으로 시작하는 행을 뺀다. 이런 변경은 GA 주석(관리 → 데이터 표시 → 주석)에도 남겼다.

## GA4 관리자 설정

### page_view와 향상된 측정

`page_view`는 코드가 직접 보낸다(`components/analytics/analytics-runtime.tsx`). 첫 로드의 자동 전송은 `send_page_view: false`로 끄고,
경로(pathname)가 바뀔 때마다 한 번 보낸다. 이렇게 하는 이유는 관리자 화면(`/admin`)을 집계에서 빼고 이전 화면을 `page_referrer`로 남기기 위해서다.
검색어·정렬·진행중/마감 탭처럼 쿼리만 바뀌는 이동은 `page_view`가 아니라 `search_submitted`, `sort_changed`, `status_tab_changed`로 센다.

그래서 향상된 측정의 **"브라우저 기록 기반 페이지 변경"은 꺼 둔다**(2026-11-06 20:44에 껐다). 이 옵션은 `send_page_view: false`로 막히지 않아,
켜져 있으면 history 변경마다 page_view가 따로 나간다([Google: Pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views)).

향상된 측정의 **사이트 검색도 꺼 두었다**(2026-11-07). 켜 두면 주소의 `q` 값이 `search_term`으로 수집될 수 있다. 스크롤, 이탈 클릭, 양식 상호작용, 동영상, 파일 다운로드는 켜져 있다.
이탈 클릭(`click`)은 원문·신청·지도·명소 클릭을 한 번 더 세므로 이벤트 수 합계를 볼 때 주의한다.

### 개인정보

- 이벤트 파라미터에 제보·의견 내용과 검색어 원문을 넣지 않는다.
- page_view의 주소(`page_location`, `page_referrer`)에 담긴 검색어 `q`는 코드가 `(redacted)`로 바꿔 보낸다(`lib/analytics/events.ts`). 검색 결과에서 상세로 갔다가 뒤로 오면 주소에 검색어가 남기 때문이다.
  웹 스트림의 데이터 수정(redaction)에도 이메일과 URL 쿼리 매개변수 `q`를 넣어 두었다([Google: 데이터 수정](https://support.google.com/analytics/answer/13544947)).
- GA 사용은 개인정보 처리방침(`/privacy`)에 알린다. Google Analytics 약관이 요구한다.

### 운영자·개발자 트래픽

- 로그인한 관리자 화면에 들어간 기기는 운영자 기기로 기억하고, 그 뒤 모든 GA 이벤트에 `traffic_type: "internal"`을 붙인다(`lib/analytics/internal-traffic.ts`, `app/layout.tsx`의 대기열 스크립트).
  휴대폰은 IP가 계속 바뀌어 IP 규칙만으로는 운영자를 가릴 수 없다. 브라우저 사이트 데이터를 지우면 표시가 풀린다.
- 데이터 필터 `Internal Traffic`(내부 트래픽 제외)은 **테스트** 상태다. 배포 뒤 운영자 기기로 관리자 화면에 한 번 들어갔다가 공개 화면을 보고,
  탐색 분석에서 "테스트 데이터 필터 이름" 측정기준에 운영자 방문만 잡히는지 확인한 뒤 **활성**으로 바꾼다. 활성 필터가 뺀 데이터는 되살릴 수 없다.
- 데이터 필터 `Developer Traffic`(디버그 모드 이벤트 제외)은 2026-11-07부터 활성이다.

### 보관과 맞춤 측정기준

이벤트·사용자 데이터 보관 기간은 14개월(무료 속성의 최댓값)이다. 2026-11-07 전에는 기본값 2개월이었다.

아래 저카디널리티 파라미터를 이벤트 범위 맞춤 측정기준으로 등록했다(2026-11-07). 측정기준 이름은 파라미터 이름과 같게 두고, 설명에 값 목록을 적었다.
등록 뒤 보고서에 보이기까지 24~48시간이 걸린다.

- `event_category`
- `content_source`
- `link_position`
- `sort_method`
- `source_type`
- `map_method`
- `application_available`
- `status_tab`
- `result_count`

`event_slug`, `place_name`, 날짜처럼 값 종류가 계속 늘어나는 항목은 등록하지 않는다. 행사 상세에서 일어난 이벤트는 모든 이벤트에 자동으로 붙는 페이지 경로로 행사를 구분한다.
불필요한 맞춤 측정기준 등록은 `(other)` 행 증가와 할당량 낭비를 만든다.

### 탐색 분석과 보고서 메뉴

판단 규칙을 바로 볼 수 있게 탐색 분석 **"속초모아 핵심 퍼널"**을 만들어 두었다(2026-11-07). 탭마다 위 판단 규칙 하나를 본다.

| 탭 | 단계 |
| --- | --- |
| 상세→원문·신청 | `event_detail_viewed` → `source_link_clicked` 또는 `application_link_clicked` |
| 명소 클릭률 | `nearby_places_viewed` → `nearby_place_clicked` 또는 (`map_link_clicked`, `link_position`에 `nearby_place_card` 포함) |
| 관련 행사 클릭률 | `related_events_viewed` → `select_content`(`content_source`에 `related_events` 포함) |
| 제보 완료율 | `page_view`(`page_location`에 `/report` 포함) → 같은 경로의 `form_start` → `event_report_submitted` |
| 의견 완료율 | 위와 같고 경로 `/feedback`, 마지막 단계 `feedback_submitted` |
| 재방문 코호트 | 첫 방문 주별, 그 뒤 주마다 다시 온 사용자 수 |

기간은 탐색 분석 왼쪽 "변수"에서 바꾼다(기본 지난 28일). 2026-11-07에 더한 이벤트를 쓰는 탭은 배포 뒤부터 숫자가 쌓인다.
운영자 방문은 내부 트래픽 필터를 활성으로 바꾼 뒤부터 빠진다.

왼쪽 보고서 메뉴(라이브러리)는 이 사이트에 맞게 줄였다(2026-11-07).
- "Business objectives" 컬렉션을 "속초모아 보고서"로 바꾸고, 전자상거래용 "판매 촉진" 주제와 리드 전용 보고서를 뺐다.
  "리드 생성" 주제에는 사용자 획득, 트래픽 획득, 방문 페이지만 남겼다. 주제 이름은 GA 편집기에서 바꿀 수 없어 그대로 두었다.
- 쓰지 않는 "데이터 가져오기" 컬렉션은 게시를 취소했다(라이브러리에 남아 있어 다시 게시할 수 있다).

### UTM

앞으로 붙일 UTM(알림, 홍보 글)은 소문자와 밑줄로 쓰고 아래 값만 쓴다. 같은 출처가 `Web_Push`, `webpush`처럼 갈라지지 않게 하기 위해서다.

| 매개변수 | 값 |
| --- | --- |
| `utm_source` | `web_push` |
| `utm_medium` | `push`(GA 기본 채널 그룹의 Mobile Push Notifications로 분류됨) |
| `utm_campaign` | 알림 종류: `weekend_digest`, `new_events`, `deadline_reminder` |
| `utm_content` | 발송 회차, 예: `weekend_digest_2026-11-14` |

## 배포 뒤 확인

E2E는 `dataLayer`로 GA에 보낼 이벤트 이름·파라미터·횟수를 확인한다(`tests/e2e/public-event-flow.spec.ts`, `tests/e2e/feedback-flow.spec.ts`, `tests/e2e/analytics-internal-traffic.spec.ts`).
GA가 받아서 어떻게 처리했는지는 배포 뒤에만 볼 수 있으므로, 측정을 바꿔 배포하면 DebugView나 실시간 보고서에서 아래를 본다.

- 상세 진입 한 번에 `event_detail_viewed`와 `page_view`가 한 번씩만 온다
- 상세에서 관련 행사 상세로 이동하면 새 상세에서 `nearby_places_viewed`·`related_events_viewed`가 다시 온다
- 사이트 안에서 이동한 뒤 `page_view`의 `page_title`이 새 화면 제목이다
- `application_available` 같은 true/false 값이 어떤 형태로 들어오는지 본다
- `/admin`에서 `page_view`가 없고, 어디에도 검색어가 없다
- 배포한 날을 GA 주석에 남긴다

참고: [GA4 권장 이벤트](https://developers.google.com/analytics/devguides/collection/ga4/reference/events), [이벤트 파라미터 설정](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters), [향상된 측정](https://support.google.com/analytics/answer/9216061), [데이터 필터](https://support.google.com/analytics/answer/10108813)
