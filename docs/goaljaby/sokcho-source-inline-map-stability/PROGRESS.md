## Goal 검토 요약

- 목표: 운영 행사 원문·위치를 실제 콘텐츠까지 검증하고 카카오 인라인 지도, 무문구 이미지 fallback, 무이동 관리자 상태 UI를 완성한다.
- 마일스톤: 기준선 감사 → 원문 교정 → 위치·지도 → 이미지·관리자 UI → 배포·운영 감사.
- 필수 검증: lint, typecheck, unit, build, 데스크톱·모바일 E2E, 운영 원문 `N/N`, 지도 `M/M`, 관리자 1px 기준.
- scope 잠금: 승인된 원문·위치·지도·fallback·관리자 UI와 위치 DB 필드 밖으로 확장하지 않고 사용자 변경을 보존한다.

---

# PROGRESS

## 현재 골

모든 운영 행사의 공식 원문과 위치를 실제 콘텐츠까지 검증하고, 상세 화면에 정확한 카카오 지도를 직접 표시하며, 이미지 대체 화면과 관리자 상태 변경 UI를 안정화한다.

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
- 위치 근거 필드·좌표 쌍 DB 제약, 관리자 입력 검증, 카카오 인라인 지도와 실패 fallback 구현
- null·빈 문자열·404 이미지의 무문구 고정 크기 fallback 구현
- 관리자 버튼·badge·작업 셀 고정, overlay 오류, 안정 정렬과 desktop/mobile 1px CLS 회귀 구현
- 원문 저장 시 과거 `event_sources`를 수정하지 않고 canonical 원문을 새 이력으로 upsert하도록 보완
- 감사 UUID 20건만 확인 시각을 갱신하고 18개 위치·무비 나잇·20개 원문 불일치 시 전체 rollback하는 migration guard 구현
- 운영 Supabase에 위치 schema와 검증 데이터 migration 적용 및 사후 무결성 재조회
- `dcdd92394b9f6b558661f43e9e05a57646822ae9`를 `main`에 반영하고 Vercel production 배포 완료
- production 공개 행사 7건의 노출 원문 href와 실제 행사 상세를 재확인하고, 전체 실제 운영 20건 감사표와 운영 DB를 대조
- production 관리자 목록·수정 화면에서 실제 행을 `검수 대기 → 반려 → 검수 대기`로 변경하며 저장 전·중·후 위치를 측정하고 상태 개수 `21/7/0`으로 복구
- 카카오 JavaScript SDK 도메인에 `https://sokcho-moa.vercel.app`과 `http://localhost:3000`이 모두 저장됐고 Vercel production 키가 로컬 계약과 일치함을 확인

## 마지막 검증 결과

```text
구현 통합 검증 2026-07-19
- pnpm lint: 통과
- pnpm typecheck: 통과
- pnpm test: 통과 (11 files, 38 tests)
- pnpm build: 통과 (Next.js production build, 19 pages)
- pnpm test:e2e: 통과 (desktop/mobile 8 tests)
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
- 사용자 .env.example 카카오 키 변수 변경 보존
```

## 실패 시도

| 시도 | 변경 | 결과 | 배운 점 |
| --- | --- | --- | --- |
| 1 | 로컬 service-role로 운영 `events`·`event_sources` 읽기 전용 백업 시도 | 자격증명 값이 없어 데이터 접근 전 중단, 운영 변경 없음 | 비밀값을 추가 노출하지 않고 기존 관리자 브라우저 세션 또는 인증된 서버 경로로 감사해야 함 |
| 2 | sandbox 안에서 typecheck·unit 재실행 | 저장소 바깥 캐시 쓰기 `EPERM`으로 제품 코드 실행 전 중단 | 동일 명령을 승인된 저장소 권한으로 재실행해 typecheck와 35개 unit 모두 통과, 제품 실패가 아님 |
| 3 | 실제 관리자 컴포넌트 E2E 첫 경로 | Next.js가 `_` 시작 폴더를 private로 처리해 404 | 개발 전용 일반 경로로 옮기고 production에서는 `notFound()`로 잠금 |
| 4 | 관리자 컴포넌트 E2E locator | `공개`가 `비공개`에도 부분 일치 | 접근성 이름을 `exact: true`로 지정 |
| 5 | 모바일 관리자 CLS 측정 | 클릭 자동 가로 스크롤을 레이아웃 이동으로 오인 | 컨트롤 전체를 먼저 viewport에 맞춘 뒤 동일 scroll 위치에서 측정 |
| 6 | 전체 병렬 E2E 저장 중 상태 관찰 | 300ms 모의 저장이 다른 측정 전에 끝나는 간헐 실패 | 모의 저장을 1.2초로 고정해 전·중·후 상태를 안정적으로 관찰, 전체 6/6 통과 |
| 7 | Supabase schema migration 첫 입력 | SQL Editor가 사전점검 쿼리 일부를 남겨 문법 오류, 실행 전 중단 | 편집기 전체 선택·삭제 후 migration 단독 여부를 확인해 재실행, 성공 |
| 8 | production 카카오맵 제품 활성화 | 앱의 카카오맵 권한이 없어 활성화 거부 | 비즈니스 앱 전환·비즈니스 정보 심사·카카오맵 권한 신청은 사용자 본인 확인과 약관 동의가 필요한 외부 선행 조건 |

## 현재 가장 안정적인 상태

제품 변경·SQL migration·배포·원문·관리자 운영 감사까지 완료됐다. 백업과 기존 검수 상태는 보존돼 있다. 지도는 검증된 18건에만 렌더 조건이 충족되며, 카카오 앱 권한이 활성화될 때까지 고정 높이 주소 fallback이 정상 노출된다.

## 다음 단계

사용자가 카카오 Developers 앱 `1517897`을 비즈니스 앱으로 전환하고 비즈니스 정보 심사와 카카오맵 권한 신청을 완료한다. 승인 후 카카오맵 제품을 켜고 production 지도 18/18·모바일/데스크톱·콘솔 오류 0건을 재감사한다.

## 리스크 / 블로커

- production 인라인 지도는 키·도메인·코드·좌표가 준비됐지만 카카오 Developers 앱의 카카오맵 권한이 없어 제품을 켤 수 없다. 본인 확인·약관 동의를 포함한 비즈니스 앱 전환과 카카오 심사가 필요하므로 사용자가 완료해야 한다.
- 공식 기관 사이트의 HTML 오류나 bot 차단은 URL 모양이 아니라 실제 브라우저 본문과 행사 사실로 판정해야 한다.
- 카카오 권한 승인 전에는 production 지도 `18/18`을 완료로 판정하지 않고 Goal도 완료 처리하지 않는다.

## 인수인계 메모

Goaljaby Codex가 생성한 운영 계약이다. 각 마일스톤과 실패 후 이 문서를 업데이트한다. 사용자 비밀번호·카카오 키·Supabase 비밀값을 기록하거나 커밋하지 않는다.
