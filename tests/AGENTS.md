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

## 남길 가치가 있는 test (2026-11-24)

- 기능이 깨지면 실패하고, 사용자가 보는 결과가 같은 리팩토링에는 통과하는 test만 둡니다. 쓸 때 "이 기능을 망가뜨리면 실패하나"를 확인합니다.
- 한 동작은 한 층에서 한 번 검사합니다. 정렬·필터·날짜·SEO 문구·구조화 데이터는 unit이 보고, E2E는 그 결과가 화면·주소·상태 코드로 이어지는지만 봅니다.
- 지운 기능이 "없음"을 확인하는 test는 두지 않습니다. 문구만 바뀌어도 저절로 통과합니다.
- test용 가짜(지도 SDK 등)는 앱이 기대는 실제 동작과 같게 만들고, 가짜 안의 호출 횟수·내부 값은 검사하지 않습니다.
- 재시도로만 통과하는(flaky) test는 원인을 고치거나 지웁니다. timeout·retry를 늘려 가리지 않습니다.

## E2E 작성

- 우리가 통제하는 것만 검사합니다. 로컬 서버 밖 요청(바깥 링크 새 창, 외부 SDK·스크립트)은 `route`로 막거나 가짜 응답을 줍니다.
- 요소는 `getByRole`·`getByLabel`로 찾고, 기다림은 `await expect(…)`·`expect.poll`로 합니다. `waitForTimeout`·`networkidle`은 새로 쓰지 않습니다.
- 브라우저 이벤트가 "가지 않았다"를 확인할 때는 hydration 뒤에 일어나는 다른 결과를 먼저 기다립니다. 바로 보면 아직 안 보냈을 뿐인데도 통과합니다.
- test는 순서와 상관없이 혼자 통과해야 합니다. DB를 바꾸는 test는 전용 seed 행이나 직접 만든 데이터를 쓰고, 실패해도 되돌리게 `try/finally`로 정리합니다.
- seed 날짜는 `pnpm db:reset` 시각 기준입니다. 개수·진행 상태를 검사하는 데 쓰는 seed 행사는 마감·종료를 하루 이상 뒤로 둡니다.
  로컬에서 E2E 전에는 `pnpm db:reset`과 `.next/cache/fetch-cache` 삭제로 이전 데이터를 지웁니다.

## 작성 방법

- test 파일은 대상 옆이 아니라 `unit/`, `e2e/`에 둡니다.
- 날짜 로직은 고정된 `now`를 씁니다. 행사 데이터는 `unit/support/event-builder.ts`로 만듭니다.
- E2E는 로컬 Supabase와 `supabase/seed.sql` 데이터로 production build를 띄워 실행합니다. 운영 DB 주소면 시작하지 않습니다(`e2e/local-supabase.ts`).
- 관리자 E2E는 seed의 로컬 관리자 계정으로 로그인합니다. DB 상태를 바꾸는 E2E와 화면 폭을 직접 지정하는 E2E는 `desktop-chromium`에서만 실행합니다.
