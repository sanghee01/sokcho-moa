# 코드 규칙 결정 기록

AI가 읽는 규칙 문서(`AGENTS.md`)에는 규칙과 한 구절짜리 이유만 둡니다. 이 문서는 사람이 읽는 기록으로, 규칙을 **언제, 무엇을 근거로**
정했는지 남깁니다. 규칙 본문의 원본은 각 `AGENTS.md`입니다.

## AI 지침 구조 (2026-11-06)

- **결정**: 폴더마다 `AGENTS.md`를 원본으로 두고, 같은 폴더의 `CLAUDE.md`는 `@AGENTS.md` 한 줄로 불러옵니다.
  예전의 `.ai/RULES.md`, `.ai/CONVENTIONS.md`는 루트와 폴더별 `AGENTS.md`로 나눠 옮겼습니다. 화면 명세(`.ai/DESIGN.md`)와 리뷰 정책(`.ai/review/`)은 그대로 둡니다.
- **이유**: Supabase 규칙은 `supabase/`를 고칠 때만, 화면 규칙은 화면을 고칠 때만 읽히게 하면서 Claude Code와 Codex가 같은 원본을 읽게 하려고.
  - Claude Code는 하위 폴더 파일을 다룰 때 그 폴더의 `CLAUDE.md`를 불러오고, 루트에 `CLAUDE.md`가 있으면 `AGENTS.md`를 따로 읽지 않습니다.
    다른 도구와 파일을 함께 쓸 때 `@AGENTS.md` import를 안내합니다([Claude Code memory](https://code.claude.com/docs/en/memory)).
  - Codex는 루트부터 작업 폴더까지의 `AGENTS.md`를 이어 붙이고, 합계 32KiB까지만 읽습니다. `@` import는 지원하지 않습니다
    ([Codex AGENTS.md](https://developers.openai.com/codex/agent-configuration/agents-md), [agents.md](https://agents.md/)).
  - `.claude/rules`의 경로 지정은 Claude 전용이라 쓰지 않았습니다.
  - supabase/supabase 저장소가 같은 방식(폴더별 `AGENTS.md` + `CLAUDE.md`의 `@AGENTS.md`)을 씁니다.
- **고르지 않은 대안**: 봄봄(Bombom-Team/client)처럼 `.ai/`에 원본을 모으고 폴더마다 symlink를 두는 방식. 한 곳에서 볼 수 있지만,
  symlink 위치에서 상대 링크가 깨지고 Claude의 편집이 symlink를 거쳐 쓰지 않으며, 링크를 검사하는 장치가 따로 필요합니다.
- **실행 전 차단(2026-11-06)**: 예외 없는 운영 안전 규칙은 문장 대신 Claude Code 설정으로 막습니다.
  `.claude/settings.json`의 PreToolUse hook(`.claude/hooks/guard-tool-use.mjs`)이 운영 Supabase 명령(`--remote`, `link`, `db push`,
  `migration repair`, Supabase 호스트로의 `psql`), 비밀값 파일(.env, .env*.local) 읽기·쓰기, 커밋된 migration과 `database.types.ts` 수정을
  막고, 같은 파일은 deny 규칙에도 둡니다. Bash deny 규칙은 명령 앞부분만 비교해 `pnpm exec supabase … --remote`를 놓치므로 hook으로 검사합니다
  ([permissions](https://code.claude.com/docs/en/permissions), [hooks](https://code.claude.com/docs/en/hooks)).
  Codex는 이 설정을 읽지 않고, 사용자가 터미널에서 직접 실행하는 명령은 거치지 않습니다.
  `main` 직접 커밋은 리팩토링 기간(로드맵 0~9단계)에 사용자가 허용했으므로 막지 않고, 끝난 뒤 GitHub ruleset으로 보호합니다.
- 결정 기록(이 문서)을 AI 문서 밖에 둔 이유: [Claude Code best practices](https://code.claude.com/docs/en/best-practices)는 AI 지침을 짧게,
  코드로 알 수 없는 것만 쓰라고 권합니다. 두 도구 모두 매번 읽는 문서의 토큰을 줄입니다.

## 테스트 (2026-11-06)

사용자가 AI 제안을 일단 채택하고 쓰면서 고치기로 했습니다. 규칙 본문: [루트 AGENTS.md의 검증 및 완료](../../AGENTS.md#검증-및-완료), [tests/AGENTS.md](../../tests/AGENTS.md), [supabase/AGENTS.md](../../supabase/AGENTS.md).

| 규칙 | 이유와 근거 |
| --- | --- |
| 버그는 실패하는 test로 먼저 재현 | 실패를 확인하지 않은 test는 처음부터 통과해 아무것도 보호하지 않을 수 있음. [Claude Code best practices](https://code.claude.com/docs/en/best-practices), Simon Willison red/green TDD |
| 기존 test를 바꾸거나 지우기 전에 묻기 | AI는 test를 고쳐 통과시키는 경향이 있음. ImpossibleBench(arXiv 2510.20270): Claude 계열 부정행위의 79% 이상이 test 수정 |
| 동작을 검사하고 구현 세부는 검사하지 않기 | 구현 세부 test는 리팩토링마다 깨지고 실제 버그는 잡지 못함. Google SWE book 12장, Testing Trophy. 화면 배치 예외(가로 넘침, 첫 화면 노출)는 디자인 개편 지침을 정하며 추가 |
| 권한을 바꾸면 pgTAP에 허용·거부 test | DB 권한은 마지막 방어선이고 RLS 거부는 오류 없이 0행이 됨. [Supabase RLS testing](https://supabase.com/docs/guides/database/postgres/testing-row-level-security) |

## 화면·스타일 (2026-11-06)

사용자가 디자인 개편 "추천안"을 채택하고 지침 갱신을 지시했습니다. 규칙 본문: [루트 AGENTS.md의 코드 규칙](../../AGENTS.md#코드-규칙), 명세: [.ai/DESIGN.md](../../.ai/DESIGN.md).

| 규칙 | 이유와 근거 |
| --- | --- |
| 색·글자·모서리는 역할 토큰으로만 | 2026-11-06 진단에서 원색 class가 약 380곳. 같은 의미가 화면마다 다른 색이 되고 브랜드색 변경이 어려움. 역할 이름은 앱으로 옮길 때도 씀. Tailwind v4 `@theme`, [DTCG 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) |
| 모바일 화면을 기본으로 class 작성 | 사용자의 84.6%가 모바일(GA4, 2026-10-09~11-05) |
| 터치 대상 44px 이상 | WCAG 2.2(24px)보다 넉넉한 Apple 44pt. 모바일 사용자와 50대 이상 주민, 앱 전환 고려 |

## 코드 규칙 (2026-11-06)

현재 코드가 지키는 패턴을 세고(`app/`, `components/`, `features/`, `lib/`, 커밋 `49abb5a`), 공식 문서와 대조한 뒤 사용자가 채팅 선택지로 골랐습니다.
규칙 본문: 루트와 폴더별 `AGENTS.md`. `N/`는 설치된 Next.js 16.4.5 문서 `node_modules/next/dist/docs/01-app/`입니다.

### 현재 코드가 이미 지키던 규칙 (일괄 채택)

| 규칙 | 측정 | 공식 근거 |
| --- | --- | --- |
| `function` 선언 | 261 : 화살표 8 | [Google TS 가이드](https://google.github.io/styleguide/tsguide.html) "named function은 function 선언" |
| named export, `app/` 예외 | `app/` 밖 default 0 | Google(default export 금지), `N/03-api-reference/03-file-conventions/page.md` |
| barrel 파일 없음 | 0 | Vercel `vercel-react-best-practices` `bundle-barrel-imports` |
| kebab-case 파일, `@/` import, 큰따옴표 | 100%, 350 : 0, 100% | 공식 기본값과 다름(Google은 snake_case·상대경로·작은따옴표). 이미 통일되어 있어 저장소의 선택으로 유지 |
| `enum` 금지 | 0 | TS 핸드북 Enums, TS 5.8 `erasableSyntaxOnly` |
| `any`·`@ts-ignore`·`eslint-disable` 금지 | 0 | typescript-eslint `recommended` |
| 외부 입력 zod 검증 | 모든 action·route | [Zod](https://zod.dev/basics), `N/02-guides/data-security.md` |
| `cond && <X />`, 왼쪽은 boolean | 25 : `: null` 4 | react.dev conditional rendering(숫자 0 주의) |
| `"use client"` 최소화, `server-only`, 필요한 props만 | 28개 파일, 16개 | `N/01-getting-started/05-server-and-client-components.md`, `data-security.md` |
| `process.env`는 `lib/env*.ts`에서만 | 4곳 중 2곳 정리 필요 | `data-security.md` |
| Supabase client 세 종류의 쓰임, `getSession()` 금지 | 지킴 | [Supabase API keys](https://supabase.com/docs/guides/api/api-keys), [Next.js 서버 인증](https://supabase.com/docs/guides/auth/server-side/nextjs) |
| action 순서(관리자·방문자), 페이지마다 인가 | 지킴 | `N/02-guides/server-actions.md`, `authentication.md` |
| 캐시 단위와 `cache.ts`, `updateTag`·`revalidateTag(…, "max")` | 지킴 | `updateTag.md`, `revalidateTag.md`. `unstable_cache`는 `"use cache"`로 대체 예정이지만 cacheComponents가 꺼져 있어 유효 |
| `Asia/Seoul` helper, `now` 인자, 상태는 model에서 | 지킴, 15곳 | `N/02-guides/preventing-flash-before-hydration.md`, react.dev "components must be pure" |
| RLS `to` 역할과 `(select auth.uid())`, `security definer` + `search_path = ''`, execute 회수 | 지킴 | [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database functions](https://supabase.com/docs/guides/database/functions) |
| 이름(handleX·onX, is·has, 단위 접미사, xxxAction·getXxx), 한국어 "왜" 주석 | 지킴 | react.dev Responding to Events, `N/02-guides/server-and-client-boundary.md` |

### 골라서 정한 규칙

| 규칙 | 선택 | 측정과 근거 |
| --- | --- | --- |
| 객체 타입 | `interface`로 전환 | 현재 `type` 73 : `interface` 0. TS 핸드북·Google·typescript-eslint 기본값이 `interface`. union·`z.infer`·Supabase 파생 타입은 `type`으로 남음 |
| props 타입 위치 | 시그니처 안, 페이지는 `PageProps<"/route">` | 시그니처 안 약 36 : `XxxProps` 7. `PageProps`는 Next.js 16 전역 helper(`page.md`) |
| 상수 이름 | 고정 설정값만 `UPPER_SNAKE_CASE` | UPPER 52 : camel 82. Google: CONSTANT_CASE는 바뀌지 않는 최상위 값에 "쓸 수 있음" |
| 예상한 실패 | throw하지 않고 반환값 | `N/01-getting-started/10-error-handling.md`. 버튼 action 21곳이 `throwActionError`로 throw하던 것을 `buttonActionFailed` 반환으로 바꿈. 관리자 화면이 "저장에 실패했습니다" 대신 실제 이유를 보여 줌 |
| RLS 정책 | 작업별로 나누고 `for all` 금지 | Supabase 권고. 기존 `for all` 정책 8개를 migration `20261106132943`에서 grant가 있는 작업별 정책 23개로 나눔(권한은 그대로, `08_admin_policies_per_command`로 확인) |
| lint 강제 | 추가 패키지 없이 가능한 규칙만 `eslint.config.mjs`에 추가 | 예외 없는 규칙은 문장보다 lint로 강제하라는 Claude Code best practices 권고. 켠 규칙: `consistent-type-definitions`(interface), `func-style`(function 선언, 타입 표기가 붙은 변수는 허용), enum 금지, `app/` 밖 default export 금지, 상대경로 import 금지(css 제외), `@ts-*` 주석 금지, `noInlineConfig`(eslint-disable 무시). 따옴표 규칙은 ESLint 9에서 deprecated라 켜지 않음. 켤 때 객체 `type` 33곳과 화살표 함수 선언 43곳을 고침. 의존 방향(`components`·`lib` → `app`·`features` 금지, `features` → `app` 금지, 다른 feature는 `model`만)도 `no-restricted-imports`로 추가(2026-11-06, 켤 때 위반 0곳) |
| 공식 skill | 성능은 Vercel `vercel-react-best-practices`를 링크로 참고 | Vercel 평가(2026-01): 항상 읽히는 문서가 skill보다 잘 지켜짐 → 꼭 지킬 규칙은 `AGENTS.md`에 |

## 코드 품질 점검 후속 (2026-11-07)

코드베이스 전체 점검(개인 메모 09) 뒤 사용자가 고칠 항목과 아래 규칙을 정했습니다.

| 규칙 | 선택 | 측정과 근거 |
| --- | --- | --- |
| JSX `&&` 왼쪽 | `react/jsx-no-leaked-render`로 강제(`validStrategies: coerce, ternary`) | 문장 규칙과 코드가 달랐음(왼쪽이 문자열·객체인 곳). 왼쪽에 숫자가 온 곳은 없어 실제 버그는 없었음. eslint-config-next에 이미 들어 있는 eslint-plugin-react 규칙이라 새 패키지 없음. 이 규칙은 타입을 몰라 boolean 변수도 `Boolean()`이나 비교식으로 써야 함. 켤 때 21곳 수정. 고르지 않은 대안: 문장을 "숫자만 금지"로 좁히기(lint로 강제 못 함), 타입 기반 `strict-boolean-expressions`(typed lint 설정이 필요하고 JSX 밖 조건문까지 바뀜) |
| 버튼 `danger` | 확인 창 안의 확정 버튼에만, 확인 창을 여는 "삭제"는 `secondary` | 확인 창이 따로 버튼 class를 가지고 있었음. 관리자 화면도 공통 helper·입력 스타일을 쓰게 바꿈(입력 글자 14px → 16px, 버튼 36~40px → 44px). 원본은 [.ai/DESIGN.md](../../.ai/DESIGN.md) Components |

### 아직 규칙에 맞추지 않은 코드

규칙 이전 코드는 리뷰에서 지적하지 않습니다. 리팩토링에서 맞출 곳입니다.

- `proxy.ts`의 `process.env` 직접 읽기. 값이 없으면 오류 대신 그냥 통과시키는 동작이라, `getPublicEnv()`(값이 없으면 throw)로 바꾸면 동작이 달라져 남겨 둠
- 원색 class가 남은 28개 파일(디자인 개편 4~6단계)
