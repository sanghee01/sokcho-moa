## Goal 검토 요약

- 목표: 운영 행사 원문·위치를 실제 콘텐츠까지 검증하고 네이버 인라인 지도, 무문구 이미지 fallback, 무이동 관리자 상태 UI를 완성한다.
- 마일스톤: 기준선 감사 → 원문 교정 → 위치·지도 → 이미지·관리자 UI → 배포·운영 감사.
- 필수 검증: lint, typecheck, unit, build, 데스크톱·모바일 E2E, 운영 원문 `N/N`, 지도 `M/M`, 관리자 1px 기준.
- scope 잠금: 승인된 원문·위치·지도·fallback·관리자 UI와 위치 DB 필드 밖으로 확장하지 않고 사용자 변경을 보존한다.

---

# PROGRESS

## 현재 골

모든 운영 행사의 공식 원문과 위치를 실제 콘텐츠까지 검증하고, 상세 화면에 정확한 네이버 지도를 직접 표시하며, 이미지 대체 화면과 관리자 상태 변경 UI를 안정화한다.

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

## 마지막 검증 결과

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

## 현재 가장 안정적인 상태

네이버 로컬 전환은 전체 자동 검증과 독립 P1/P2 감사를 통과했지만 아직 커밋·배포하지 않았다. production은 기존 카카오 구현 배포의 고정 높이 주소 fallback 상태다. 백업·원문·위치 좌표·검수 상태는 보존돼 있고 지도는 검증된 18건에만 렌더 조건이 충족된다. 병행 브랜딩 작업은 별도 커밋 `e55291a`, `1c40d33`으로 보존됐으며 네이버 변경은 그 위에서 검증했다.

## 다음 단계

사용자 NAVER Cloud Maps 애플리케이션의 Web 서비스 URL에 localhost·production을 등록하고 대표 계정을 확인한다. Dynamic Map 한도를 월 100,000건·일 5,000건, 알림을 70%로 저장한 뒤 Vercel에 공개 Client ID만 설정한다. production 지도 18/18·모바일/데스크톱·콘솔 오류 0건을 재감사한다.

## 리스크 / 블로커

- 네이버 Maps 애플리케이션의 Client ID·Web 서비스 URL·대표 계정 조회·결제수단 등록·한도 설정은 사용자 NAVER Cloud 계정에서 완료해야 한다. 이 환경은 콘솔 접근이 보안 정책으로 차단됐으며, 대표 계정이 아니면 Client ID를 설정하지 않고 무료 범위 한도·요청 제한 증거 없이는 배포하지 않는다.
- 병행 브랜딩·헤더 변경은 별도 사용자 작업 커밋 `e55291a`, `1c40d33`으로 확인돼 되돌리거나 네이버 변경으로 재분류하지 않는다.
- 공식 기관 사이트의 HTML 오류나 bot 차단은 URL 모양이 아니라 실제 브라우저 본문과 행사 사실로 판정해야 한다.
- 네이버 Client ID·Web 서비스 URL·대표 계정 무료 제공 여부가 확인되고 production 지도 `18/18`이 실제로 보이기 전에는 Goal을 완료 처리하지 않는다.

## 인수인계 메모

Goaljaby Codex가 생성한 운영 계약이다. 각 마일스톤과 실패 후 이 문서를 업데이트한다. 사용자 비밀번호·지도 인증값·Supabase 비밀값을 기록하거나 커밋하지 않는다.
