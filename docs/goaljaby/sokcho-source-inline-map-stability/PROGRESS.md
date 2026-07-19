## Goal 검토 요약

- 목표: 운영 행사 원문·위치를 실제 콘텐츠까지 검증하고 지도 미리보기 없는 위치 안내, 무문구 이미지 fallback, 무이동 관리자 상태 UI를 완성한다.
- 마일스톤: 기준선 감사 → 원문 교정 → 위치 데이터·무과금 링크 → 이미지·관리자 UI → 배포·운영 감사.
- 필수 검증: lint, typecheck, unit, build, 데스크톱·모바일 E2E, 운영 원문 `N/N`, 지도 미리보기·SDK 요청 0건, 관리자 1px 기준.
- scope 잠금: 승인된 원문·위치 데이터·외부 링크·fallback·관리자 UI와 위치 DB 필드 밖으로 확장하지 않고 사용자 변경을 보존한다.

---

# PROGRESS

## 현재 골

모든 운영 행사의 공식 원문과 위치를 실제 콘텐츠까지 검증하고, 상세 화면에서 지도 미리보기와 SDK를 제거한 채 장소·주소와 외부 지도 링크를 제공하며, 이미지 대체 화면과 관리자 상태 변경 UI를 안정화한다.

## 현재 마일스톤

마일스톤 5 — 전체 검증·배포·운영 감사

## Goal 시작 기록

- 시작 시각: 2026-07-19T21:59:25+09:00
- 실행 환경: codex
- objective 길이: 994자

## 완료

- 저장소와 실제 검증 명령 확인
- 무비 나잇의 `mode=view` / `bmode=view` 원인 확인
- 카카오 지도 키·도메인 요구사항 확인
- 이미지 fallback과 관리자 레이아웃 이동 원인 확인
- Goaljaby 운영 계약 작성·검증·승인 및 Goal 시작
- 운영 변경 전 `events`·`event_sources` 28행 CSV 백업과 상태 개수 고정
- 실제 운영 행사 `N=20` 원문 본문·공식 이미지 전수 감사 `20/20`
- 비운영 샘플 `D=8` 전수 식별 및 보존 사유 기록
- 시설관리공단 `bmode=view` 상세 URL 규칙과 무비 나잇 canonical URL 회귀 테스트 구현
- 단일 장소 18건 공식 주소·카카오 POI 교차 확인, 다중·영역 장소 2건 지도 제외 근거 기록
- 위치 근거 필드·좌표 쌍 DB 제약, 관리자 입력 검증, 공급자 전환 전 카카오 인라인 지도와 실패 fallback 구현
- null·빈 문자열·404 이미지의 무문구 고정 크기 fallback 구현
- 관리자 버튼·badge·작업 셀 고정, overlay 오류, 안정 정렬과 desktop/mobile 1px CLS 회귀 구현
- 원문 저장 시 과거 `event_sources`를 수정하지 않고 canonical 원문을 새 이력으로 upsert하도록 보완
- 감사 UUID 20건만 확인 시각을 갱신하고 18개 위치·무비 나잇·20개 원문 불일치 시 전체 rollback하는 migration guard 구현
- 운영 Supabase에 위치 schema와 검증 데이터 migration 적용 및 사후 무결성 재조회
- `dcdd92394b9f6b558661f43e9e05a57646822ae9`를 `main`에 반영하고 Vercel production 배포 완료
- production 공개 행사 7건의 노출 원문 href와 실제 행사 상세를 재확인하고, 전체 실제 운영 20건 감사표와 운영 DB를 대조
- production 관리자 목록·수정 화면에서 실제 행을 `검수 대기 → 반려 → 검수 대기`로 변경하며 저장 전·중·후 위치를 측정하고 상태 개수 `21/7/0`으로 복구
- 카카오 JavaScript SDK 도메인에 `https://sokcho-moa.vercel.app`과 `http://localhost:3000`이 모두 저장됐고 Vercel production 키가 로컬 계약과 일치함을 확인
- 제어 가능한 카카오 SDK 계약으로 로딩→성공·실패 288px 유지, 단일 마커·검증 좌표, 포커스·wheel 스크롤, 데스크톱·모바일 가로 넘침을 회귀 테스트로 고정
- 정상·null·빈 문자열·404 이미지의 목록 16:9·상세 영역 크기와 무문구 fallback을 데스크톱·모바일에서 검증
- 제품 구현에 사용자 첨부 화면이나 이미지 파일을 복사·재게시하지 않았음을 커밋·추적 파일·참조 문자열로 확인
- Playwright 서버에 비밀값이 아닌 전용 dummy 공개 키를 주입하고 실제 SDK script URL·`autoload=false` 로더 경로를 가짜 SDK 응답으로 검증해 `.env.local`·외부 네트워크 의존을 제거

## 승인된 scope 변경 — 2026-07-19

- 사용자가 카카오 추가 앱의 사업자 심사·유료 사용을 원하지 않아 지도 공급자를 네이버 Maps JavaScript API v3로 명시적으로 변경했다.
- 기존 위치 근거·18개 WGS84 좌표·DB 제약과 카카오 구현 이력은 보존하고, 인라인 SDK·환경 계약·fallback 링크·테스트·운영 설정만 네이버 기준으로 전환한다.
- 네이버는 개인 회원도 결제수단 등록이 필요하다. 대표 계정인 경우에만 Client ID를 배포하고, 계정 전체 Dynamic Map 한도의 합을 월 무료 제공량 6,000,000건 이하로 고정한다. 속초모아에는 더 낮은 보수적 한도·임계치 알림을 설정하며, 한도 초과 요청 제한 증거 없이 실제 청구 방지를 보장하지 않는다.
- 카카오 loader와 환경 계약을 네이버 Maps JS v3 `ncpKeyId` loader·`NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`로 교체하고 카카오 외부 지도 링크를 제거
- 네이버 SDK 실제 script 요청, 단일 마커·검증 좌표, 모든 지도 상호작용 비활성, 네트워크 실패·`navermap_authFailure`·전역 callback 복원을 데스크톱·모바일 E2E로 검증
- SDK 인증 실패 전 선행 자원 파괴, SDK·타일 hang, 이탈 뒤 늦은 인증 실패, stale Promise 폐기·두 번째 SDK 요청을 실제 순서의 회귀로 고정
- `tilesloaded` 전에는 로딩 상태를 유지하고 전체 8초 deadline 뒤 동일 높이 fallback, SDK 내부 링크는 시각적 표시는 보존한 채 `inert`로 포커스·상호작용 차단
- 네이버 지도 전환 구현·테스트·운영 계약을 커밋 `56cb9de`로 현재 기능 브랜치에 보존

## 무과금 운영 결정 — 2026-07-20

- 사용자가 지도 공급자를 네이버 Maps로 최종 확정했고 실제 청구가 발생하는 운영은 허용하지 않았다.
- 개인 회원도 Maps 대표 계정이 될 수 있으므로 사업자등록증은 완료 전제가 아니다. 다만 전화번호 기준 대표 계정 1개에만 무료 이용량이 적용되므로 콘솔의 대표 계정 확인 결과를 필수 증거로 남긴다.
- 속초모아 Dynamic Map 한도는 무료 제공량보다 훨씬 낮은 월 100,000건·일 5,000건으로 설정하고 70% 임계치 알림과 실제 수신자를 등록한다. 대표 계정·한도·알림을 확인하기 전에는 공개 Client ID를 운영 배포에 넣지 않는다.
- 코드에서 공급자 사용량·대표 계정 여부를 강제하거나 검증할 수 없으므로 이 콘솔 설정은 운영 완료조건이며, 조건을 만족하지 못하면 동일 높이 주소 fallback을 유지하고 Goal을 완료 처리하지 않는다.

## 이전 네이버 전환 검증 결과 — 폐기된 지도 계약

```text
네이버 전환 최종 로컬 검증 2026-07-20
- pnpm lint: 통과
- pnpm typecheck: 통과
- pnpm test: 통과 (12 files, 41 tests)
- pnpm build: 통과 (Next.js production build, 30 static/dynamic routes generated)
- pnpm test:e2e: 통과 (desktop/mobile 22 tests)
- 실제 EventReviewRow·StatusControls 목록과 행사 수정 화면의 성공·실패 rollback bounding box: 모두 1 CSS px 이하
- 운영 DB: events 28, 실제 20, 샘플 8, 검수 대기 21, 공개 7, 반려 0
- 운영 DB: 지도 준비 18, 좌표·근거 위반 0, 제외 2건 좌표·근거 null
- 운영 DB: 무비 나잇 canonical 원문 및 external_id 11208 단건 확인
- 제품 구현 Vercel production deployment `2BArJZQQp4QVNUT6kTjz88LZUXEd`: Ready·Production, `https://sokcho-moa.vercel.app`
- production 공개 7건 href: 모두 교정된 공식 상세 또는 공식 파일과 정확히 일치
- production 관리자 목록 실측: 행 `1104 × 73px`, 컨트롤 `317.78125 × 36px`, 컨트롤 상대 y `16.5px`, 인접 행 상대 y `73px`가 저장 전·중·성공·복구 후 동일
- production 행사 수정 실측: 헤더 `89.7109375 × 32px`, 컨트롤 `256.3359375 × 36px`, 첫 필드 `510 × 42px`와 상대 위치가 저장 전·중·성공·복구 후 동일
- production 관리자 복구: 검수 대기 21, 공개 7, 반려 0, 테스트 행 `검수 대기`
- production 공개 화면 콘솔 오류: 0건
- git diff --check: 통과
- 기존 카카오·신규 네이버 인증값은 출력·문서화·커밋하지 않음
- 독립 지도 diff 감사: 잔여 P1/P2 없음
```

## 마지막 검증 결과

```text
지도 미리보기 제거 최종 로컬 검증 2026-07-20
- 기준: 최신 원격 main `3caf484`를 지도 전환 이력 브랜치와 merge한 격리 브랜치 `agent/remove-map-preview`
- 제품 변경 commit: `bf8bbaa` (`refactor: remove embedded map preview`)
- pnpm lint: 통과
- pnpm typecheck: 통과
- pnpm test: 통과 (10 files, 39 tests)
- pnpm build: 통과 (Next.js production build, 21 static/dynamic routes)
- pnpm test:e2e: 통과 (desktop/mobile 12 tests)
- 상세 위치 카드: 지도 role/img·로딩·실패 문구·288px 예약 영역 없음, 장소명·주소·네이버 외부 링크·새 창·analytics 계약 유지
- 네이버 `oapi.map.naver.com`과 카카오 `dapi.kakao.com` SDK script/network 요청: 0건 회귀로 고정
- 위치 카드는 desktop grid에서 `self-start`로 소개 카드 높이만큼 늘어나지 않으며 mobile/desktop 가로 넘침 없음
- 기존 원문·이미지 fallback·관리자 성공/실패 rollback 회귀 모두 통과
- git diff --check: 통과
```

## 실패 시도

| 시도 | 변경 | 결과 | 배운 점 |
| --- | --- | --- | --- |
| 1 | 로컬 service-role로 운영 `events`·`event_sources` 읽기 전용 백업 시도 | 자격증명 값이 없어 데이터 접근 전 중단, 운영 변경 없음 | 비밀값을 추가 노출하지 않고 기존 관리자 브라우저 세션 또는 인증된 서버 경로로 감사해야 함 |
| 2 | sandbox 안에서 typecheck·unit 재실행 | 저장소 바깥 캐시 쓰기 `EPERM`으로 제품 코드 실행 전 중단 | 동일 명령을 승인된 저장소 권한으로 재실행해 typecheck와 38개 unit 모두 통과, 제품 실패가 아님 |
| 3 | 실제 관리자 컴포넌트 E2E 첫 경로 | Next.js가 `_` 시작 폴더를 private로 처리해 404 | 개발 전용 일반 경로로 옮기고 production에서는 `notFound()`로 잠금 |
| 4 | 관리자 컴포넌트 E2E locator | `공개`가 `비공개`에도 부분 일치 | 접근성 이름을 `exact: true`로 지정 |
| 5 | 모바일 관리자 CLS 측정 | 클릭 자동 가로 스크롤을 레이아웃 이동으로 오인 | 컨트롤 전체를 먼저 viewport에 맞춘 뒤 동일 scroll 위치에서 측정 |
| 6 | 전체 병렬 E2E 저장 중 상태 관찰 | 300ms 모의 저장이 다른 측정 전에 끝나는 간헐 실패 | 모의 저장을 1.2초로 고정해 전·중·후 상태를 안정적으로 관찰, 전체 6/6 통과 |
| 7 | Supabase schema migration 첫 입력 | SQL Editor가 사전점검 쿼리 일부를 남겨 문법 오류, 실행 전 중단 | 편집기 전체 선택·삭제 후 migration 단독 여부를 확인해 재실행, 성공 |
| 8 | production 카카오맵 제품 활성화 | 계정의 두 번째 카카오맵 앱이라 권한이 없어 활성화 거부 | 일반 문서에는 개인 개발자 비즈 앱 경로가 있으나 사용자가 실제 추가 신청 과정에서 사업자등록증 요구를 확인했고, 심사·유료 대안을 원하지 않아 네이버 전환을 승인함 |
| 9 | NAVER Cloud Maps 콘솔 접근 | 작업 환경의 enterprise network policy가 `console.ncloud.com` 접근을 차단 | 우회하지 않고 코드·문서·로컬 검증을 완료했으며 Client ID·대표 계정·한도 설정은 사용자 콘솔 작업으로 남김 |
| 10 | 전체 E2E의 SDK timeout 재진입 회귀 | 고정 5초 네트워크 대기가 병렬 부하에서 두 번째 요청을 늦춰 20/22 통과 | 화면 timeout 직후 첫 요청을 명시적으로 해제하는 gate로 실제 경로는 유지하고 race를 제거해 전체 22/22 통과 |
| 11 | 관련 E2E 직후 전체 E2E 재실행 | 이전 Playwright 서버가 포트 3100을 해제하는 순간과 겹쳐 제품 실행 전 중단 | 포트가 해제된 것을 확인한 뒤 동일 명령 재실행, 전체 22/22 통과 |
| 12 | 지도 제거 production build 첫 실행 | 샌드박스가 Turbopack의 내부 로컬 포트 바인딩을 `EPERM`으로 차단해 제품 컴파일 전 중단 | 동일 `pnpm build`를 승인된 정상 권한으로 재실행해 21개 route build 통과, 제품 실패가 아님 |
| 13 | 지도 제거 전체 E2E 첫 실행 | 샌드박스가 Playwright webServer의 `127.0.0.1:3100` 바인딩을 `EPERM`으로 차단해 테스트 전 중단 | 동일 `pnpm test:e2e`를 승인된 정상 권한으로 재실행해 desktop/mobile 12/12 통과, 제품 실패가 아님 |

## 현재 가장 안정적인 상태

지도 SDK와 미리보기 제거는 격리 브랜치 제품 커밋 `bf8bbaa`로 보존됐고 전체 로컬 검증을 통과했다. production은 아직 이전 고정 높이 주소 fallback 배포이므로 새 계약의 운영 감사 전이다. 백업·원문·위치 좌표·검수 상태는 변경하지 않았고, 원래 작업트리의 병행 브랜딩 파일도 건드리지 않았다.

## 다음 단계

최종 문서·대체 회귀를 커밋하고 최신 `main`에 반영한다. production 배포가 준비되면 지도 미리보기·iframe·SDK 요청 0건, 장소·주소·외부 링크, 모바일·데스크톱 UI, 콘솔 오류 0건을 감사한다.

## 리스크 / 블로커

- 지도 플랫폼 계정·Client ID는 더 이상 완료 전제가 아니며, 제품이 카카오·네이버 SDK를 요청하지 않는 것을 운영에서 증명해야 한다.
- 병행 브랜딩·헤더 변경은 별도 사용자 작업 커밋 `e55291a`, `1c40d33`으로 확인돼 되돌리거나 네이버 변경으로 재분류하지 않는다.
- 공식 기관 사이트의 HTML 오류나 bot 차단은 URL 모양이 아니라 실제 브라우저 본문과 행사 사실로 판정해야 한다.
- production에서 지도 미리보기·빈 fallback 박스·SDK 요청이 모두 0건이고 위치 텍스트·외부 링크가 정상임을 확인하기 전에는 Goal을 완료 처리하지 않는다.

## Blocked audit — 2026-07-20

- 반복된 완료조건: AC-2의 production 지도 `18/18`과 AC-5의 실제 배포·시각 감사를 증명하려면 사용자 NAVER Cloud 계정의 대표 계정 확인, Web 서비스 URL, 무과금 한도·알림, 공개 Client ID가 필요하다.
- 연속 Goal turn 1: NAVER Cloud 콘솔이 작업 환경의 보안 정책으로 차단된 사실을 확인하고, SDK 구현·자동 회귀·운영 계약을 먼저 완료한 뒤 사용자 콘솔 설정을 요청했다.
- 연속 Goal turn 2: 사용자의 무과금 결정을 반영해 개인 회원 대표 계정 가능 여부와 월 6,000,000건 무료 제공량을 공식 문서로 재확인하고, 월 100,000건·일 5,000건·70% 알림·Client ID 전달 절차를 안내했지만 외부 설정 증거가 추가되지 않았다.
- 연속 Goal turn 3: source-of-truth 5개 문서를 다시 읽고 현재 저장소·원격 브랜치·환경 계약을 재조회했다. `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`는 로컬 환경과 현재 프로세스에 없고, 원격 `main`은 `3caf484`로 네이버 커밋을 포함하지 않으며 검증 구현은 원격 기능 브랜치 `1d335d6`에 안전하게 보존돼 있다.
- 가장 안정적인 상태: production은 임의·추정 좌표 없이 기존 고정 높이 주소 fallback을 유지하고, 네이버 구현과 41개 unit·22개 desktop/mobile E2E 증거는 기능 브랜치에 보존돼 있다. 운영 데이터·검수 상태와 병행 중인 브랜딩 파일은 변경하지 않았다.
- 다음 안전한 옵션: 사용자가 NAVER Cloud에서 대표 계정, Dynamic Map 월 100,000건·일 5,000건, 70% 알림·수신자, `http://localhost`·`http://sokcho-moa.vercel.app` 등록을 확인하고 공개 Client ID만 제공하거나 Vercel에 직접 설정하면 Goal을 재개해 최신 `main`과 통합·production 배포·지도 `18/18` 감사를 수행한다.
- 같은 외부 블로커가 3개의 연속 Goal turn에서 반복됐고 계정 소유자 작업 없이는 안전한 production 활성화가 불가능하므로 Goal을 `blocked`로 전환한다. 완료조건·무과금 요구사항은 약화하지 않는다.

## Goal 재개·지도 미리보기 연기 결정 — 2026-07-20

- 사용자가 서비스 성장 전까지 지도 API 과금 위험을 감수하지 않기로 하고 인라인 지도 미리보기 제거를 명시적으로 승인했다.
- 위 Blocked audit은 당시 판단 근거로 보존하되, 지도 플랫폼 계정 설정을 완료조건에서 제거해 외부 블로커를 해소한다.
- 장소명·주소·검증 좌표·위치 근거·좌표 쌍 제약은 보존하고, 지도 SDK·iframe·로딩/fallback 박스·지도 환경 변수만 제거한다.
- 일반 외부 지도 링크는 SDK 호출이나 플랫폼 과금 계약이 없는 일반 새 창 링크로 유지한다.
- 인라인 지도 재도입은 서비스 규모와 비용 정책을 다시 검토하는 미래의 별도 scope다.

## 인수인계 메모

Goaljaby Codex가 생성한 운영 계약이다. 각 마일스톤과 실패 후 이 문서를 업데이트한다. 사용자 비밀번호·지도 인증값·Supabase 비밀값을 기록하거나 커밋하지 않는다.
