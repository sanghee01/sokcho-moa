# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

위 블록은 Next.js가 관리합니다. `next dev`가 버전에 맞게 고쳐 쓰므로 직접 수정하지 않습니다.

속초모아 저장소에서 작업하는 모든 AI agent가 처음 읽는 문서입니다. 작업 원칙, 검증, 저장소 전체에 걸친 코드 규칙을 둡니다.
폴더에만 해당하는 규칙은 그 폴더의 `AGENTS.md`에 있습니다.

## 지침 파일 구조

- 규칙의 원본은 각 폴더의 `AGENTS.md`입니다. 같은 폴더의 `CLAUDE.md`는 `@AGENTS.md` 한 줄로 원본을 불러옵니다.
  Codex는 `AGENTS.md`를, Claude Code는 `CLAUDE.md`를 읽어 두 도구가 같은 원본을 씁니다.
- **작업할 파일이 아래 경로에 있으면 그 폴더의 `AGENTS.md`를 먼저 읽습니다.** 도구가 자동으로 불러오지 않았으면 직접 읽습니다.

| 작업 경로 | 먼저 읽을 문서 | 내용 |
| --- | --- | --- |
| `app/` | [app/AGENTS.md](app/AGENTS.md) | 라우트·페이지, metadata, 관리자 페이지 인가 |
| `components/` | [components/AGENTS.md](components/AGENTS.md) | 공통 UI 부품 |
| `features/` | [features/AGENTS.md](features/AGENTS.md) | 도메인 폴더: model, queries, actions, cache |
| `lib/` | [lib/AGENTS.md](lib/AGENTS.md) | 환경 변수, Supabase client 선택 |
| `supabase/` | [supabase/AGENTS.md](supabase/AGENTS.md) | migration, RLS, DB 함수, pgTAP |
| `tests/` | [tests/AGENTS.md](tests/AGENTS.md) | unit·E2E test 작성 |
| 화면·스타일(`app/`, `components/`, `features/*/components`, `app/globals.css`) | [.ai/DESIGN.md](.ai/DESIGN.md) 전체 | 색·글자·배치 토큰, 컴포넌트, 반응형 검증 |
| Pull request review | [.ai/review/REVIEW.md](.ai/review/REVIEW.md), [false-positives.md](.ai/review/false-positives.md) | 무엇을 어떤 근거로 지적할지 |
| 코드 위치, 의존 방향, 영향 범위 | [docs/architecture.md](docs/architecture.md) | 폴더, 라우트, 데이터 흐름, 테이블 권한 |

## 작업 원칙

- 삭제·리팩토링·구조 변경은 사용자가 이해하고 결정한 뒤에만, 그 범위 안에서 합니다. 필요해 보이면 작업하지 않고 근거와 함께 제안합니다.
- 이유를 모르는 기존 코드는 추측해 설명하지 않고 "이유 확인 필요"로 남깁니다.
- 한 작업은 한 영역의 좁은 변경으로 제한합니다. 관련 없는 refactor, rename, reformatting, dependency 변경을 섞지 않습니다.
- 사용자 요청이 목표와 범위를 정합니다. 요청한 결과에 직접 필요한 supporting file은 함께 고칠 수 있습니다.
- code와 configuration으로 확인할 수 있는 사실은 먼저 확인합니다. 제품 동작, 데이터 계약(table·RPC·server action의 입력과 반환),
  인증·권한, 작업 범위를 바꾸는 판단이 필요하면 멈추고 사용자에게 묻습니다.

## 작업 범위 파악

넓은 directory 전체를 먼저 읽지 않습니다.

1. 사용자가 지정한 file, error, 화면, route, 기능 이름을 찾습니다.
2. entry point를 봅니다. 화면은 `app/`의 `page.tsx`와 조립하는 `features/<도메인>/components`, 쓰기는 form component와
   `features/<도메인>/actions.ts`(관리자는 `admin/actions.ts`), 데이터는 `features/<도메인>/queries.ts`와 관련 migration입니다.
3. 가장 가까운 test(`tests/unit/`, `tests/e2e/`, `supabase/tests/`)를 함께 봅니다.
4. 수정 범위가 확인된 뒤에만 다른 영역으로 넓힙니다.

## 의존성과 도구 설정

- 새 library·dependency는 사용자가 설계를 상의하며 직접 정한 것만 설치합니다.
- 아래는 사용자가 직접 지시한 경우에만 바꿉니다. 오류가 나거나 작업에 방해된다는 이유로 바꾸지 않습니다.
  - dependency 추가·삭제·버전 변경, `package.json`의 `pnpm.overrides`
  - `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json`, `.github/workflows/`
- 의존성이나 설정 때문에 막히면 멈추고 원인과 선택지를 알린 뒤 지시를 받습니다.
- `node_modules` 안의 파일은 수정하지 않습니다. `pnpm patch`, `patch-package`도 쓰지 않습니다.

## 운영 데이터

운영 DB는 Vercel 실서비스가 쓰는 Supabase 프로젝트 하나뿐이고, 잘못 쓰면 되돌릴 방법이 마땅치 않습니다.

- 운영 DB에 쓰지 않습니다. `supabase link`, `--remote`가 붙은 명령, `supabase db push`, `supabase migration repair`,
  SQL Editor·MCP를 통한 `insert`·`update`·`delete`·DDL, Storage 파일 변경을 하지 않습니다. 적용은 사용자가 합니다.
- 운영 DB를 읽어야 하면 실행할 SQL을 먼저 보여 주고, 사용자가 실행하거나 허락한 뒤에만 읽기 전용으로 실행합니다.
- 로컬 DB(`pnpm db:start`, `db:reset`, `db:test`, `db:types`)는 Docker 안에서만 동작하므로 자유롭게 씁니다.
- `.env.local` 등 실제 비밀값 파일을 읽거나 출력하지 않습니다. 변수 이름은 `.env.example`에서 확인합니다.
- `supabase/review/`는 운영 행사 정보가 담긴 수집 검토 자료라 Git에 넣지 않고, 사용자가 지정하지 않으면 근거로 쓰지 않습니다.
- migration 작성 규칙은 [supabase/AGENTS.md](supabase/AGENTS.md)에 있습니다.
- Claude Code에서는 이 중 운영 Supabase 명령, 비밀값 파일, 커밋된 migration·생성 타입 수정을 `.claude/hooks/guard-tool-use.mjs`가
  실행 전에 막습니다. 막히면 우회하지 말고 사용자에게 알립니다.

## 검증 및 완료

| 변경 종류 | 필요한 검증 |
| --- | --- |
| 문서만 변경 | `git diff --check`, 수정한 link·path·command·저장소 사실 확인 |
| 일반 application code | `pnpm lint`, `pnpm typecheck` |
| 기존 test가 있는 기능 | 위에 더해 해당 기능의 focused test(`pnpm test tests/<파일>`) |
| `features/*/model` 순수 로직 | 위에 더해 `pnpm test` 전체. 날짜·시간대 로직은 경계값(자정, 월말, KST↔UTC) test를 확인 |
| UI 또는 사용자 흐름 | `pnpm lint`, `pnpm typecheck`, 대상 흐름의 `pnpm test:e2e tests/e2e/<파일>`과 `tests/e2e/responsive-layout.spec.ts`(로컬 Supabase 필요). 360·412·768·1280px에서 바뀐 화면을 직접 열고, 확인한 페이지와 데이터 상태(긴 제목, 이미지 없음, 마감)를 보고 |
| server action, 인증·권한, cache·revalidate | `pnpm lint`, `pnpm typecheck`, 관련 focused test, [REVIEW.md의 데이터·권한](.ai/review/REVIEW.md#데이터권한) 항목을 스스로 점검한 결과 보고 |
| route 추가·삭제, `next.config.ts`, 정적 생성(`generateStaticParams`, `revalidate`) | 위 검증에 더해 `pnpm test:e2e` 전체(production build를 로컬 Supabase로 실행) |
| Supabase migration | `pnpm db:reset`, `pnpm db:test`, `pnpm db:types` 후 생성 타입 diff 확인. 권한을 바꿨으면 허용·거부 test 추가. rollback 파일과 운영 적용 전 확인할 SQL을 보고 |
| `data/attractions.json` | `pnpm places:check` |
| dependency·설정 변경(지시받은 경우) | CI(`.github/workflows/ci.yml`)와 같은 순서로 `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test`, `build` |

- `pnpm lint --fix`는 사용자가 요청했거나 lint 오류가 확인된 경우에만 실행하고, 바뀐 내용을 검토합니다.
- 필요한 검증을 실행할 수 없으면 이유와 대신 확인한 근거를 알립니다. 변경과 무관한 기존 failure는 따로 알리고 고치려고 섞지 않습니다.
- 버그 수정과 동작 변경은 기대 동작을 담은 test를 먼저 쓰고, 실패를 확인한 뒤 코드를 고칩니다. 완료 보고에 실패→통과 출력을 붙입니다.
- 기존 test의 assertion 변경·삭제, `.skip`·`.only` 추가는 이유를 들어 먼저 묻습니다. 구현 버그를 test 수정으로 가리지 않습니다.
- test를 붙이려고 code를 옮기거나 re-export 경로를 만들지 않습니다. 일회성 확인 script는 저장소 밖에서만 실행합니다.

## 코드 규칙

저장소 전체에 적용합니다. 규칙이 생기기 전에 쓴 코드는 리뷰에서 지적하지 않고, 새로 쓰거나 고친 줄에 적용합니다.
`function` 선언, named export, `interface`, `enum`·`@ts-*`·`eslint-disable` 금지, `@/` import, JSX `&&` 왼쪽, 의존 방향(`app → features → components, lib`,
다른 feature는 `model`만)은 `pnpm lint`가 강제합니다(`eslint.config.mjs`).
결정 날짜·측정 숫자·공식 근거는 [docs/decisions/conventions.md](docs/decisions/conventions.md)에 있습니다.

**함수와 모듈**
- 컴포넌트와 이름 있는 함수는 `function`으로 선언합니다. 화살표 함수는 인자로 넘기는 콜백에만 씁니다.
- named export만 씁니다. `export default`는 Next.js가 요구하는 `app/` 파일(page, layout, loading, error, not-found, route 메타 파일)에만 씁니다.
- `index.ts` barrel 파일을 만들지 않습니다.
- 파일·폴더 이름은 kebab-case입니다.
- import는 `@/` 절대경로로 씁니다. 문자열은 큰따옴표를 씁니다.

**타입**
- 객체 타입은 `interface`로 선언합니다. union, 파생 타입(`z.infer`, `Pick`, Supabase 생성 타입)처럼 `interface`로 쓸 수 없을 때만 `type`을 씁니다.
- `enum` 대신 문자열 union과 `as const` 배열을 씁니다.
- `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`을 쓰지 않습니다.
- 외부 입력(form, URL, `[param]`, `searchParams`, JSON, route body)은 zod로 검증한 뒤 씁니다.

**React**
- 컴포넌트는 기본이 Server Component입니다. `"use client"`는 상태·이벤트·브라우저 API가 필요한 가장 작은 컴포넌트에만 붙입니다.
- Client Component에는 화면에 필요한 필드만 props로 넘깁니다.
- props 타입은 함수 시그니처에 바로 씁니다(`({ event }: { event: Event })`). `app/` 페이지는 `PageProps<"/route">`를 씁니다.
- 한쪽만 그리는 조건은 `cond && <X />`로 쓰고, `&&` 왼쪽에는 boolean만 둡니다(숫자 0이 화면에 찍힘). lint는 타입을 몰라 boolean 변수도 `Boolean(x)`나 비교식(`x !== null`)으로 씁니다.
- 여러 곳에서 쓰는 className 조합은 `xxxClassName` 상수나 `getXxxClassName()` 함수로 뺍니다.

**이름**
- 컴포넌트 안 이벤트 처리 함수는 `handleX`, 콜백 props는 `onX`입니다.
- boolean과 판별 함수는 `is`·`has`·`can`·`should`로 시작합니다.
- 고정된 설정값(숫자, 문자열, 호스트 목록, 정규식)은 `UPPER_SNAKE_CASE`, zod schema·className·라벨 표·계산된 값은 `camelCase`입니다.
- 단위가 있는 숫자 상수는 이름 끝에 단위를 붙입니다(`_MS`, `_PX`, `_BYTES`, `_DAYS`).
- server action은 `xxxAction`, 조회 함수는 `getXxx`입니다.

**화면·스타일** (값과 컴포넌트 명세는 [.ai/DESIGN.md](.ai/DESIGN.md))
- className에 원색 팔레트 class(`teal-700`)와 임의 값(`text-[#07377a]`, `rounded-[2rem]`)을 쓰지 않고 역할 토큰(`bg-surface`, `text-content-muted`, `rounded-control`, `text-title-2`)을 씁니다. 굵기는 `font-normal`·`font-medium`·`font-semibold`·`font-bold`만 씁니다.
- 접두사 없는 class는 360px 화면용이고, 넓은 화면에서 바뀌는 값만 `sm:`·`md:`·`lg:`·`xl:`로 덧붙입니다. `max-*:`로 모바일 값을 덮어쓰지 않습니다.
- 누를 수 있는 요소는 44×44px 이상이고, 붙어 있는 터치 요소 사이는 8px 이상입니다.

**주석**
- 주석은 한국어로 "왜"를 씁니다. 사용자 결정이나 바뀐 이유가 있으면 날짜를 붙입니다(`(2026-11-06)`).

**공식 skill**
- 성능(waterfall, bundle, re-render)은 Vercel `vercel-react-best-practices` skill을 참고합니다. skill의 예시가 이 문서의 규칙(`interface`, 큰따옴표, named export 등)과 다르면 이 문서를 따릅니다.

## Git

- commit은 사용자가 요청할 때만, push는 사용자가 채팅에서 직접 요청할 때만 합니다.
- 커밋은 작업 묶음 단위로 적게 만듭니다. 사용자 피드백으로 이어지는 작은 수정은 커밋마다 나누지 않고, 아직 push하지 않았으면 같은 주제의 직전 커밋에 합치거나
  사용자가 커밋을 요청할 때 한 번에 묶습니다(2026-11-06 사용자 결정: 커밋이 너무 잦았음).
- 커밋 메시지에 `Co-Authored-By` 같은 AI 공동 작업 표시를 넣지 않습니다. 본문은 핵심만 짧은 개조식(`- `)으로 씁니다(2026-11-06 사용자 결정).
- `main`에 직접 commit하지 않고 작업 branch에서 진행합니다. PR 본문은 [PR 템플릿](.github/pull_request_template.md)을 따릅니다.

## AI가 읽는 문서 작성

- 규칙은 해당 폴더의 `AGENTS.md`에 한 줄 bullet로 쓰고, 이유가 필요하면 한 구절만 붙입니다. 코드 예시를 복사하지 않고 파일 경로를 가리킵니다.
- `CLAUDE.md`에는 `@AGENTS.md` 한 줄만 둡니다. 도구가 `CLAUDE.md`에 내용을 추가하라고 제안하면 같은 폴더의 `AGENTS.md`에 반영합니다.
- 한 정보의 원본은 하나만 둡니다. `package.json` script, 설정값, route 목록처럼 다른 파일에 원본이 있으면 복사하지 않고 경로를 안내합니다.
- 규칙은 사용자가 결정한 것만 추가합니다. AI 리뷰 지적을 사용자가 "앞으로도 지킬 규칙"으로 수용하면 해당 `AGENTS.md`에, 반박한 지적은
  [false-positives.md](.ai/review/false-positives.md)에 씁니다. 결정 날짜와 근거는 [docs/decisions/conventions.md](docs/decisions/conventions.md)에 남깁니다.
- Codex는 루트부터 작업 폴더까지의 `AGENTS.md`를 합쳐 32KiB까지만 읽습니다. 이 파일은 16KiB, 폴더 파일은 각각 6KiB보다 작게 유지합니다.

## Language

사용자가 읽는 설명과 report는 한국어로 씁니다. 기술 용어는 처음 나올 때 뜻과 선택 이유를 함께 설명합니다.
Command, path, code, 기존 identifier는 영어 표기를 유지합니다.
