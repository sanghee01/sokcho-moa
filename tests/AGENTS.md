# tests/AGENTS.md

unit test(`unit/`)와 E2E(`e2e/`)의 규칙입니다. 버그를 실패하는 test로 먼저 재현하는 규칙과 기존 test를 바꾸기 전에 묻는 규칙은
[루트 AGENTS.md의 검증 및 완료](../AGENTS.md#검증-및-완료)에 있습니다. DB test는 [supabase/AGENTS.md](../supabase/AGENTS.md)를 봅니다.

## 층별 역할

- lint·typecheck: 모든 변경
- unit(Vitest, `unit/`): `features/*/model`의 순수 로직, zod 검증, server action·route handler의 분기 결과
- pgTAP(`supabase/tests/database/`): RLS, grant, RPC
- E2E(Playwright, `e2e/`): 핵심 사용자 여정, async Server Component 렌더링, 화면 배치

## 무엇을 검사하나

- 공개 함수의 입력·출력, 응답 상태 코드, 사용자가 보는 결과를 검사합니다.
- CSS 값·class 이름·픽셀 위치, UI 문구 전체, 설정값·SQL·seed 문자열, snapshot, mock 호출 순서는 검사하지 않습니다.
- 화면 배치가 사용자에게 주는 결과는 E2E로 검사합니다: 지정 폭(360·412·768·1280)에서 가로로 넘치지 않음, 첫 화면에 특정 정보가 보임(`e2e/responsive-layout.spec.ts`).
  글자 크기·색·간격 값은 검사하지 않고 [.ai/DESIGN.md](../.ai/DESIGN.md)와 리뷰로 지킵니다.

## 작성 방법

- test 파일은 대상 옆이 아니라 `unit/`, `e2e/`에 둡니다.
- 날짜 로직은 고정된 `now`를 씁니다. 행사 데이터는 `unit/support/event-builder.ts`로 만듭니다.
- E2E는 로컬 Supabase와 `supabase/seed.sql` 데이터로 production build를 띄워 실행합니다. 운영 DB 주소면 시작하지 않습니다(`e2e/local-supabase.ts`).
- 관리자 E2E는 seed의 로컬 관리자 계정으로 로그인합니다. DB 상태를 바꾸는 E2E와 화면 폭을 직접 지정하는 E2E는 `desktop-chromium`에서만 실행합니다.
