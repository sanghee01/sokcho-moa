# 운영 감사 증거 — 2026-07-19

## 기준선과 백업

- 관리자 전체 행 `A=28`: 검수 대기 21, 공개 7, 반려 0.
- 실제 운영 행사 `N=20`: `is_demo=false`인 공식 수집 행사.
- 비운영 샘플 `D=8`: `is_demo=true`이고 제목에 `[샘플]`이 명시된 UI 검증 fixture. 실제 행사가 아니므로 행사별 공식 원문이 존재하지 않는다.
- 운영 백업: `/tmp/sokcho-source-inline-map-stability-baseline-20260719T215925/production-events-and-sources.csv`
- 백업 캡처 시각: `2026-07-19T13:06:10.877936+00:00`
- 백업 무결성: events 28행, event_sources 28행, 실제 20행, 샘플 8행.
- 샘플은 삭제·상태 변경·실행 데이터로 전환하지 않고 그대로 보존한다. 운영 원문 완료율은 실제 운영 행사 `20/20`으로 집계하고 관리자 전수표에는 샘플 제외 사유를 행사별로 남긴다.

## 공식 원문 전수 감사 — 실제 운영 행사 20/20

모든 URL을 실제 브라우저에서 열어 최종 URL과 본문 또는 공식 이미지를 확인했다. 아래 URL은 모두 HTTPS 정상 응답이며 홈·목록·로그인·soft-404가 아니다.

| 상태 | 행사 | 노출 `source_url` | 본문 대조 | 판정 |
| --- | --- | --- | --- | --- |
| 검수 대기 | 2026 속초 썸머페스티벌 | `https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp?pRo=12&pSeq=13468` | 제목, 07.31~08.02, 속초해수욕장 일원 | 통과 |
| 검수 대기 | 어린이 서커스 쇼 | `https://sokcho.go.kr/sc/event/program?eventSeq=669` | 제목, 08.22, 속초문화예술회관 대공연장 | 통과 |
| 검수 대기 | 2026 강원 아트박스 공연단 〈띠띠씽-! 12동물!〉 | `https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710160553.jpg` | 공식 포스터 제목, 08.20, 문화예술회관 | 통과 |
| 검수 대기 | 2026 여름방학 특별기획전 〈우리들의 작은 친구, 곤충〉 | `https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817624` | 제목, 07.21~08.16, 박물관 제2기획전시실 | 통과 |
| 검수 대기 | 2026 속초시립박물관 지혜학교 | `https://www.sokcho.go.kr/ct/museum/archives/notice/news?articleSeq=817365` | 제목, 07.29~10.28, 박물관 강당 | 통과 |
| 검수 대기 | 2026 속초 문화버스킹 - 장사항 | `https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260715160313.jpg` | 공식 포스터, 07.25 19:00, 커피장사 | 통과 |
| 검수 대기 | 4색 버스킹 하이라이트 | `https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294` | 공연계획 표의 제목, 07.25, 엑스포 잔디광장 | 통과 |
| 검수 대기 | 제4회 시민과 함께 만드는 신날락 페스티벌 | `https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294` | 공연계획 표의 제목, 09.05, 엑스포 잔디광장 | 통과 |
| 검수 대기 | 속초시민과 함께하는 아코디언 연주회 | `https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817294` | 공연계획 표의 제목, 09.12, 엑스포 잔디광장 | 통과 |
| 검수 대기 | 2026년 하반기 평생학습강좌 | `https://www.sokcho.go.kr/sc/portal/sokchonews/notice?articleSeq=817464` | 제목, 08.24~12.11, 수복로 46 | 통과 |
| 검수 대기 | 청소년 시네마스쿨 | `https://www.sokcho.go.kr/sc/portal/sokchonews/pressrelease?articleSeq=817391` | 제목, 08.05부터 10회, 속초미디어센터 | 통과 |
| 검수 대기 | 2026년 여름방학 독서문화프로그램 | `https://library.sokcho.go.kr/sokcho/menu/259/board/51/post/1079` | 제목, 모집 시작 07.20, 도서관 공식 공지 | 통과 |
| 검수 대기 | 속초시립도서관 영화상영 〈엑시트〉 | `https://library.sokcho.go.kr/sokcho/menu/258/movie/82` | 엑시트, 07.25 14:00, 3층 시청각실 | 통과 |
| 공개 | 2026년 제2회 속초시 구인·구직자 만남의 날 | `https://www.sokcho.go.kr/sc/upload/popupzone/PPSTPT01/popupzone_PPSTPT01_20260710120524.jpg` | 공식 포스터 제목, 09.17, 속초시청 신관 | 통과 |
| 공개 | 2026년 풀이음친구랑 청소년 꿈잡(Job)기 | `https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11250&bmode=view` | 상세 ID 11250, 제목, 08.01, 코엑스 | 통과 |
| 공개 | 핫썸머워터축제 | `https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11248&bmode=view` | 상세 ID 11248, 제목, 07.25, 속초종합경기장 | 통과 |
| 공개 | 2026년 여름방학 원데이캠프 | `https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11247&bmode=view` | 상세 ID 11247, 제목, 08.10·08.11, 다중 장소 | 통과 |
| 공개 | 2026년 풀이음친구랑 집밥천재 | `https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11246&bmode=view` | 상세 ID 11246, 제목, 08.03~08.05, 풀이음친구랑 | 통과 |
| 공개 | 2026년 풀이음친구랑 Bloom Up | `https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11212&bmode=view` | 상세 ID 11212, 제목, 07.23~07.29, 푸루스플라워 | 통과 |
| 공개 | 2026년 풀이음친구랑 무비 나잇 | `https://www.sokchosiseol.or.kr/bbs/event.do?articleseq=11208&bmode=view` | 상세 ID 11208, 제목, 07.22·07.29, 번투드웍스 | 통과 |

시설관리공단 페이지 외곽에 잘못 표시되는 `고시 및 행정` 문구는 상세 ID·제목·본문·날짜 일치 여부와 무관한 사이트 템플릿 오류로 판정했다. `mode=view`, `bmode` 누락, 목록 URL은 코드 검증에서 거부한다.

## 관리자 전수표의 비운영 샘플 8건

| 상태 | 행사 | 현재 URL | 판정 |
| --- | --- | --- | --- |
| 검수 대기 | [샘플] 바다빛 가족 문화축제 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |
| 검수 대기 | [샘플] 어린이 바다 공예 체험 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |
| 검수 대기 | [샘플] 청소년 미디어 창작 교실 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |
| 검수 대기 | [샘플] 청초호 노을 음악회 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |
| 검수 대기 | [샘플] 산과 사람 기획전 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |
| 검수 대기 | [샘플] 아바이마을 이야기 산책 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |
| 검수 대기 | [샘플] 가족 그림책 낭독회 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |
| 검수 대기 | [샘플] 지난 계절 문화 프로그램 | `https://www.sokcho.go.kr/` | 비운영 fixture — 공식 행사 원문 없음 |

## 검증 위치 18건

공식 행사 원문의 장소명·주소와 카카오 Places 결과를 대조했다. 좌표는 Kakao Places가 반환한 WGS84를 DB 정밀도 6자리로 반올림했다. 같은 건물·장소의 행사는 동일한 검증 POI를 공유한다.

| 행사 | 검증 장소 | 위도, 경도 | 카카오 위치 근거 | 주소 조치 |
| --- | --- | --- | --- | --- |
| 어린이 서커스 쇼 | 속초문화예술회관 | `38.212623, 128.588542` | `https://place.map.kakao.com/10543534` | 유지 |
| 띠띠씽-! 12동물! | 속초문화예술회관 | `38.212623, 128.588542` | `https://place.map.kakao.com/10543534` | 유지 |
| 곤충 특별기획전 | 속초시립박물관 | `38.200572, 128.539408` | `https://place.map.kakao.com/9158247` | 유지 |
| 지혜학교 | 속초시립박물관 | `38.200572, 128.539408` | `https://place.map.kakao.com/9158247` | 유지 |
| 문화버스킹 - 장사항 | 커피장사 | `38.226638, 128.588002` | `https://place.map.kakao.com/1115473252` | 유지 |
| 4색 버스킹 | 엑스포잔디광장 | `38.190649, 128.584503` | `https://place.map.kakao.com/841405953` | 유지 |
| 신날락 페스티벌 | 엑스포잔디광장 | `38.190649, 128.584503` | `https://place.map.kakao.com/841405953` | 유지 |
| 아코디언 연주회 | 엑스포잔디광장 | `38.190649, 128.584503` | `https://place.map.kakao.com/841405953` | 유지 |
| 하반기 평생학습강좌 | 속초시평생교육문화센터 | `38.196667, 128.576566` | `https://place.map.kakao.com/463660174` | 유지 |
| 청소년 시네마스쿨 | 속초미디어센터 | `38.176031, 128.596420` | `https://place.map.kakao.com/2030312267` | `농공단지1길 4` 보완 |
| 여름방학 독서문화프로그램 | 속초시립도서관 | `38.186778, 128.590864` | `https://place.map.kakao.com/27110028` | 유지 |
| 영화상영 〈엑시트〉 | 속초시립도서관 | `38.186778, 128.590864` | `https://place.map.kakao.com/27110028` | 유지 |
| 구인·구직자 만남의 날 | 속초시청 신관 | `38.207710, 128.592084` | `https://place.map.kakao.com/17248991` | 유지 |
| 청소년 꿈잡(Job)기 | 코엑스 | `37.511824, 127.059159` | `https://place.map.kakao.com/17573702` | 유지 |
| 핫썸머워터축제 | 속초종합경기장 | `38.192883, 128.534749` | `https://place.map.kakao.com/10565967` | 유지 |
| 집밥천재 | 풀이음친구랑 | `38.192896, 128.538146` | `https://place.map.kakao.com/1232522750` | 공단 본사 주소 `92`를 실제 POI `관광로363번길 14`로 교정 |
| Bloom Up | 푸루스 플라워 | `38.201990, 128.570494` | `https://place.map.kakao.com/478263281` | `만리공원길 34` 보완 |
| 무비 나잇 | 번투드웍스 | `38.259382, 128.558417` | `https://place.map.kakao.com/816544655` | 유지 |

지도 제외 `M-excluded=2`:

- `2026 속초 썸머페스티벌`: 장소가 `속초해수욕장 일원`인 영역 행사라 단일 대표 핀을 만들지 않는다.
- `2026년 여름방학 원데이캠프`: 청소년수련관·워터피아·ICT스포츠체험관·스낵캐슬의 다중 장소라 대표 핀을 만들지 않는다.

## 관리자 레이아웃 결함 기준선과 상태 복구

- 모바일 운영 화면에서 영화상영 〈엑시트〉 행을 `검수 대기 → 반려 → 검수 대기`로 변경하고 원상 복구했다.
- 클릭 전: 컨트롤 `67.875 × 132px`, 현재 행 높이 `165px`, 인접 행 높이 `165px`.
- 저장 중: 컨트롤 약 `97.961 × 164px`, 현재 행 높이 `197px`, 인접 행 높이 `185px`.
- 기존 목록이 `updated_at desc` 정렬이라 성공 후 현재·인접 행이 약 `675px` 재배치됐다.
- 복구 후 상태 개수는 검수 대기 21, 공개 7, 반려 0, 전체 28로 기준선과 동일하다.
- 수정 방향: 버튼 라벨·spinner 자리·badge·작업 셀 크기 고정, 오류 absolute 알림, 목록 `created_at`·`id` 안정 정렬.

## 운영 DB 반영 결과

- 적용 완료: 2026-07-19T22:45:15+09:00
- 적용 migration: `202607190002_event_location_evidence.sql`, `202607190003_verified_event_locations.sql`
- schema: 위치 근거 필드 2개와 좌표 쌍·근거 쌍·HTTPS 근거 URL 제약 3개 확인
- 데이터: 전체 28, 실제 운영 20, 비운영 샘플 8, `event_sources` 28
- 상태: 검수 대기 21, 공개 7, 반려 0 — 기준선과 동일
- 지도 준비: 실제 운영 18, 좌표 쌍 위반 0, 근거 쌍 위반 0, 좌표만 있고 근거 없는 실제 운영 행사 0
- 지도 제외: 썸머페스티벌과 원데이캠프의 위도·경도·위치 근거·확인 시각은 모두 `null`
- 무비 나잇: `events.source_url`·`official_url`이 정확한 `bmode=view` URL이며 canonical `event_sources` + `external_id=11208` 단건
- 주소 교정: 속초미디어센터 `농공단지1길 4`, 풀이음친구랑 `관광로363번길 14`, 푸루스 플라워 `만리공원길 34`
- 적용 전 첫 SQL 입력은 편집기에 이전 쿼리가 남아 parser 단계에서 중단됐고 변경은 없었다. 전체 선택 후 migration만 재입력해 성공했다.

## 자동 회귀 결과

- `pnpm lint`, `pnpm typecheck`, `pnpm build`: 통과
- `pnpm test`: 11 files, 38 tests 통과
- `pnpm test:e2e`: 데스크톱·모바일 8 tests 통과
- 관리자 실제 `EventReviewRow`·`StatusControls`: 목록과 행사 수정 화면에서 저장 전·중·성공·실패 rollback의 컨트롤·현재/인접 영역 좌표와 크기 변화 모두 1 CSS px 이하

## Vercel production 운영 감사

- commit: `dcdd92394b9f6b558661f43e9e05a57646822ae9`
- 제품 구현 deployment: `2BArJZQQp4QVNUT6kTjz88LZUXEd` — Ready·Production
- 운영 도메인: `https://sokcho-moa.vercel.app`
- 공개 행사 7건의 `원문 보기` href를 DOM에서 직접 확인했다. 무비 나잇 `11208`, Bloom Up `11212`, 집밥천재 `11246`, 원데이캠프 `11247`, 핫썸머워터축제 `11248`, 꿈잡(Job)기 `11250`은 모두 `bmode=view` 상세이고, 구인·구직자 만남의 날은 공식 포스터 파일이다.
- 공개 7건은 전부 교정된 운영 DB URL과 일치한다. 비공개 13건은 인증된 관리자 데이터와 위 20/20 실제 본문 감사표를 대조했다.
- 무비 나잇 상세의 행사기간은 `2026.07.22 ~ 2026.07.29`, 운영일정은 `07.22 · 07.29 19:00~21:00`으로 분리·통일돼 있다.
- 공개 화면 콘솔 오류는 0건이다.

## production 관리자 무이동·복구 감사

실제 `속초시립도서관 영화상영 〈엑시트〉`를 `검수 대기 → 반려 → 검수 대기`로 변경했다. 브라우저 클릭이 행으로 자동 스크롤해 절대 y값은 바뀌었지만, 요소 크기와 행 내부·인접 행 상대 위치는 모두 동일했다.

- 목록: 현재 행 `1104 × 73px`, 상태 컨트롤 `317.78125 × 36px`, 행 대비 컨트롤 y `16.5px`, 다음 행 y `73px`.
- 위 네 값은 저장 전, `aria-busy=true`, 반려 성공, 복구 저장 중, 복구 성공에서 모두 동일해 변화량은 `0px`다.
- 수정 화면: 제목 `89.7109375 × 32px`, 상태 컨트롤 `256.3359375 × 36px`, 행사명 입력 `510 × 42px`.
- 제목 대비 컨트롤 위치 `(847.6640625, -2)`, 행사명 입력 위치 `(32, 110)`도 저장 전·중·성공·복구 후 모두 동일해 변화량은 `0px`다.
- 최종 상태: 테스트 행 `검수 대기`, 전체 상태 개수 검수 대기 21·공개 7·반려 0. 기준선과 동일하다.
- 모바일과 실패 rollback은 같은 실제 컴포넌트를 사용하는 Playwright 8/8 회귀에서 1 CSS px 기준으로 통과했다.

## 카카오 production 활성화 상태

- Vercel Production·Preview에 `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`가 있고 production 빌드가 사용하는 값이 로컬 환경 계약과 일치한다. 값 자체는 기록하지 않는다.
- JavaScript SDK 도메인에 `https://sokcho-moa.vercel.app`과 `http://localhost:3000`이 저장돼 있다.
- Kakao Developers 앱 `1517897`의 카카오맵 제품은 현재 OFF다. ON 전환 시 `카카오맵 권한이 없습니다`가 표시됐다.
- 추가 기능 신청 화면은 비즈니스 앱 전환과 비즈니스 정보 심사 후 카카오맵 권한 신청을 요구하며, 현재 신청 버튼은 비활성화돼 있다.
- 본인 확인·약관 동의·사업 정보 심사는 대리할 수 없는 사용자 작업이므로 Goal의 지도 `18/18`은 아직 완료로 판정하지 않는다.
- 현재 production은 SDK 실패 계약에 따라 동일한 `h-72` 높이의 주소 fallback과 작은 길찾기 링크를 표시한다. 임의 좌표나 속초 중심점은 사용하지 않는다.
