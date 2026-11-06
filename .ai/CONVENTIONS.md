# CONVENTIONS.md

속초모아에서 AI와 사람이 코드를 작성·리뷰할 때 따르는 **코드 컨벤션의 원본(SSOT)**입니다.
코드를 변경하거나 리뷰하기 전에 이 문서 전체를 읽습니다.

| 도구 | 이 문서를 읽는 방식 |
| --- | --- |
| Claude Code | [CLAUDE.md](../CLAUDE.md)가 `@.ai/CONVENTIONS.md`로 import |
| Codex | [RULES.md](RULES.md)의 Start here 지시에 따라 직접 읽음 |

AI 행동 규칙(작업 범위, 검증, Supabase 안전)은 [RULES.md](RULES.md)에 있습니다.

---

## 이 문서를 채우는 방법

이 문서는 일부러 비워 두었습니다. 규칙은 사용자가 구조를 읽고 내린 결정으로만 채웁니다.

- 규칙은 사용자가 결정한 뒤에 추가합니다.
- AI 리뷰 지적을 사용자가 "앞으로도 지켜야 할 규칙"으로 수용하면 여기에 추가합니다.
  반박한 지적은 [false-positives.md](review/false-positives.md)로 갑니다.
- 각 절의 "기존 구현에서 관찰한 것"은 규칙이 아닙니다. 결정을 돕는 재료이며, 결정이 끝나면 지웁니다.
- AI는 이 문서에 규칙을 직접 추가하지 않습니다. 사용자가 결정한 문장을 옮기는 것만 합니다.

규칙 하나는 아래 형식으로 씁니다.

```markdown
#### 규칙 이름

- **규칙**: 한 문장. 리뷰어가 diff만 보고 지켰는지 판단할 수 있게 씁니다.
- **이유**: 이 규칙이 막는 문제. 대안을 택하지 않은 이유.
- **결정**: 언제, 어떤 근거로 정했는지(관련 PR 링크)
- **확인 방법**: lint / typecheck / test / 리뷰 중 무엇으로 지키는지
```

---

## 디렉터리와 모듈 경계

상태: **결정 전** · 관련 영역: 전체

기존 구현에서 관찰한 것:

- [architecture.md의 폴더](../docs/architecture.md#폴더) 구조로 정리돼 있습니다(Next.js·Supabase 공식 문서와 오픈소스 사례 조사 후 적용).
  이 구조를 규칙으로 확정할지 결정합니다.
- `features/events/model/event.ts`에는 타입·상태 계산·필터·정렬과 수집 후보 Zod schema(`eventCandidateSchema`)가 함께 있습니다.

## 서버·클라이언트 경계

상태: **결정 전** · 관련 영역: 데이터 모델·RLS, 공개 조회

기존 구현에서 관찰한 것:

- 조회(`queries.ts`)·Supabase client·비밀값·요청 제한 모듈에 모두 `import "server-only"`가 붙어 있습니다.

## Supabase client 선택

상태: **결정 전** · 관련 영역: 데이터 모델·RLS

기존 구현에서 관찰한 것:

- client가 세 종류입니다. 어떤 상황에 무엇을 쓰는지가 이 저장소에서 가장 중요한 규칙 후보입니다.
  자세한 내용은 [architecture.md의 Supabase client](../docs/architecture.md#supabase-client-세-종류)를 봅니다.

## Server action

상태: **결정 전** · 관련 영역: 제보·요청 제한, 관리자

결정할 것: 입력 검증 위치와 순서(검증 → 권한 → 쓰기 → revalidate), 반환 형태(상태 객체 vs throw),
오류 메시지에 DB 오류 원문을 노출할지.

기존 구현에서 관찰한 것:

- 관리자 action은 "인가 → 검증 → 쓰기 → 캐시 만료" 순서이고, 사용자에게 DB 오류 원문을 보여 주지 않게
  `lib/action-state.ts`의 helper를 씁니다. 폼 action은 상태 객체를, 버튼 action은 `throwActionError`를 씁니다.

## 데이터 조회와 캐시

상태: **결정 전** · 관련 영역: 공개 조회

결정할 것: 공개 데이터 캐시 단위(전체 목록 1건 vs 조건별), 쓰기 후 무효화할 tag·path의 원본 위치.

## 도메인 로직과 시간

상태: **결정 전** · 관련 영역: `features/*/model`

결정할 것: 날짜를 어느 시간대 기준으로 비교하는지(Asia/Seoul), "현재 시각"을 함수 인자로 받는지.

## Migration 작성

상태: **결정 전** · 관련 영역: 데이터 모델·RLS

[RULES.md의 Supabase와 운영 데이터](RULES.md#supabase와-운영-데이터)가 안전 규칙의 원본입니다.
여기에는 이름 규칙, 함수 작성 방식(`security definer` 사용 기준), grant 작성 방식 같은 작성 규칙을 둡니다.

## 테스트

상태: **결정됨**(2026-11-06, 사용자가 AI 제안을 일단 채택하고 쓰면서 고치기로 함) · 관련 영역: 전체

층별 역할: lint·typecheck는 모든 변경에서 돌린다. unit test(Vitest)는 `features/*/model`의 순수 로직, zod 검증,
server action·API route의 분기 결과를 맡는다. pgTAP은 RLS·grant·RPC를, E2E(Playwright)는 핵심 사용자 여정과
async Server Component 렌더링을 맡는다.

#### 버그는 실패하는 테스트로 먼저 재현한다

- **규칙**: 버그 수정과 동작 변경은 기대 동작을 담은 테스트를 먼저 쓰고, 실패하는 출력을 확인한 뒤 코드를 고친다.
- **이유**: 실패를 확인하지 않은 테스트는 처음부터 통과해 아무것도 보호하지 않을 수 있다.
- **결정**: 2026-11-06. 근거: [Claude Code best practices](https://code.claude.com/docs/en/best-practices), Simon Willison red/green TDD
- **확인 방법**: 리뷰. 완료 보고에 실패→통과 출력을 붙인다.

#### 기존 테스트를 바꾸거나 지우기 전에 묻는다

- **규칙**: 기존 테스트의 assertion 변경, 테스트 삭제, `.skip`·`.only` 추가는 이유를 들어 사용자에게 먼저 묻는다. 구현 버그를 테스트 수정으로 가리지 않는다.
- **이유**: AI는 테스트를 고쳐 통과시키는 경향이 있다(ImpossibleBench, arXiv 2510.20270: Claude 계열 부정행위의 79% 이상이 테스트 수정).
- **결정**: 2026-11-06
- **확인 방법**: 리뷰. diff에서 `tests/`, `supabase/tests/`의 기존 assertion 변경을 본다.

#### 동작을 검사하고 구현 세부는 검사하지 않는다

- **규칙**: 공개 함수의 입력·출력, 응답 상태 코드, 사용자가 보는 결과를 검사한다. CSS 값·클래스명·픽셀 위치, UI 문구 전체, 설정값·SQL·seed 문자열, snapshot, mock 호출 순서는 검사하지 않는다. 날짜 로직은 고정된 `now`를 쓴다(`tests/unit/support/event-builder.ts`).
- **이유**: 구현 세부 테스트는 동작이 같아도 리팩토링마다 깨지고 실제 버그는 잡지 못한다.
- **결정**: 2026-11-06. 근거: Google SWE book 12장, Testing Trophy
- **확인 방법**: 리뷰

#### 권한을 바꾸면 pgTAP에 허용과 거부를 함께 추가한다

- **규칙**: RLS·grant·RPC를 추가하거나 바꾸면 `supabase/tests/database/`에 허용되는 경우와 거부되는 경우를 각각 하나 이상 추가한다.
- **이유**: DB 권한은 보안의 마지막 방어선이고, RLS 거부는 오류 없이 0행이 되어 눈에 띄지 않는다.
- **결정**: 2026-11-06. 근거: [Supabase RLS testing](https://supabase.com/docs/guides/database/postgres/testing-row-level-security)
- **확인 방법**: `pnpm db:test`, 리뷰

## 네이밍

상태: **결정 전**
