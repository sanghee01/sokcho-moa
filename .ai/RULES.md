# RULES.md

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

위 블록은 Next.js가 관리합니다. `next dev`가 버전에 맞게 고쳐 쓰므로 직접 수정하지 않습니다.

속초모아 저장소에서 작업하는 모든 AI agent가 처음 읽는 문서이자 **AI 행동 규칙의 원본(SSOT)**입니다.
코드 컨벤션의 원본은 [CONVENTIONS.md](CONVENTIONS.md)입니다. 어떤 도구를 쓰든 똑같이 적용합니다.

| 도구 | 이 문서를 읽는 방식 |
| --- | --- |
| Codex | 루트 `AGENTS.md`(이 파일을 가리키는 symlink)를 자동으로 읽음. `CONVENTIONS.md`는 아래 Start here에 따라 직접 읽음 |
| Claude Code | 루트 [CLAUDE.md](../CLAUDE.md)가 `@.ai/RULES.md`, `@.ai/CONVENTIONS.md`로 import |

### `.ai/` 구조

AI가 읽는 문서의 원본은 `.ai/`에 둡니다. 이 문서에 적힌 경로는 저장소 루트 기준입니다.

| 경로 | 원본 내용 |
| --- | --- |
| `.ai/RULES.md` | 진입점, 작업 원칙, AI 행동 규칙(이 문서) |
| `.ai/CONVENTIONS.md` | 코드 컨벤션. 사용자가 결정한 규칙만 둠 |
| `.ai/review/REVIEW.md` | PR 리뷰 정책: 무엇을 어떤 근거로 지적할지 |
| `.ai/review/false-positives.md` | 사용자가 반박해 확정된 오탐과 적용 조건 |

사람이 읽는 설계 문서는 `docs/`에 둡니다.

| 경로 | 내용 |
| --- | --- |
| `docs/architecture.md` | 구조 지도: 폴더 규칙, 라우트, 데이터 흐름, client 종류, 테이블 권한, 테스트 |
| `docs/analytics-events.md` | GA4 측정 설계 |

도구가 자동으로 읽는 위치에는 `.ai/`로 이어지는 연결만 둡니다. 연결 파일에는 내용을 쓰지 않습니다.

| 연결 위치 | 연결 방식 | 가리키는 원본 |
| --- | --- | --- |
| 루트 `AGENTS.md` | symlink | `.ai/RULES.md` |
| 루트 `CLAUDE.md` | `@` import | `.ai/RULES.md`, `.ai/CONVENTIONS.md` |

규칙을 다른 파일에 복제하지 않고 원본 문서의 절 제목으로 링크합니다. Codex는 instruction 파일을
합계 32KiB까지만 읽으므로 이 파일을 그보다 작게 유지합니다.

## 작업 원칙

- 삭제·리팩토링·구조 변경은 사용자가 이해하고 결정한 뒤에만, 그 범위 안에서 합니다. 필요해 보이면 작업하지 않고
  근거와 함께 제안합니다.
- 이유를 모르는 기존 코드는 추측해 설명하지 않고 "이유 확인 필요"로 남깁니다.
- 한 작업은 한 영역의 좁은 변경으로 제한합니다.

## Start here

파일을 변경하기 전에 아래 순서로 읽습니다.

1. 이 문서 전체
2. **코드를 변경하거나 리뷰하는 모든 작업에서 [`.ai/CONVENTIONS.md`](CONVENTIONS.md) 전체.** 도구가
   자동으로 불러오지 않았다면 직접 읽습니다.
3. 작업에 해당하는 문서
   - 코드 위치, 의존 방향, 영향 범위: [`docs/architecture.md`](../docs/architecture.md)
   - Pull request review: [review policy](review/REVIEW.md)와 [false positives](review/false-positives.md)
4. 아래 '작업 범위 파악' 순서로 관련 code, configuration, test를 확인

## 작업 범위 파악

넓은 directory 전체를 먼저 읽지 않습니다. 다음 순서로 필요한 파일만 좁혀 갑니다.

1. 사용자가 지정한 file, error, 화면, route, 기능 이름을 찾습니다.
2. 대상의 entry point를 봅니다.
   - 화면 작업: `app/`의 `page.tsx`와 그 페이지가 조립하는 `features/<도메인>/components`
   - 쓰기 작업: 호출하는 form component와 `features/<도메인>/actions.ts`(관리자는 `admin/actions.ts`)
   - 데이터 작업: `features/<도메인>/queries.ts`, 관련 migration의 table·RLS·RPC
3. 대상과 가장 가까운 test(`tests/unit/`, `tests/e2e/`, `supabase/tests/`)를 함께 확인합니다.
4. 수정 범위가 확인된 뒤에만 다른 영역으로 탐색을 넓힙니다.

## Repository overview

Next.js App Router(서버 컴포넌트·server action)와 Supabase(Postgres, Auth, Storage, RLS)로 만든
속초 지역 행사 서비스입니다. Vercel에 배포되어 있습니다. 폴더 규칙은
[architecture.md의 폴더](../docs/architecture.md#폴더)가 원본입니다.

- `supabase/review/`는 운영 행사 정보가 담긴 수집 검토 자료라 Git에 포함하지 않습니다. 사용자가 지정하지 않으면 근거로 쓰지 않습니다.

## AI behavior rules

### 작업 범위 및 확인

- 사용자 요청이 작업의 목표와 범위를 정합니다.
- 요청한 결과를 완료하는 데 직접 필요한 supporting file은 함께 수정할 수 있습니다.
- 관련 없는 refactor, rename, reformatting, dependency 변경을 한 작업에 섞지 않습니다.
- code와 configuration으로 확인할 수 있는 사실은 먼저 확인하고 진행합니다.
- 제품 동작, 데이터 계약(table·RPC·server action의 입력과 반환), 인증·권한, 작업 범위를
  바꾸는 판단이 필요하면 멈추고 사용자에게 확인합니다.

### 의존성과 도구 설정

- 새 library·dependency는 사용자가 설계를 상의하며 직접 정한 것만 설치합니다.
- 아래 변경은 사용자가 직접 지시한 경우에만 합니다. 오류가 나거나 작업에 방해된다는 이유로
  바꾸지 않습니다.
  - dependency 추가·삭제·버전 변경, `package.json`의 `pnpm.overrides`
  - `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`,
    `playwright.config.ts`, `vercel.json`, `.github/workflows/`
  - 규칙을 끄는 주석(`eslint-disable`, `@ts-ignore`, `@ts-expect-error`)으로 오류를 피하는 것
- 의존성이나 설정 때문에 막히면 작업을 멈추고 원인과 선택지를 알린 뒤 지시를 받습니다.
- `node_modules` 안의 파일은 수정하지 않습니다. `pnpm patch`, `patch-package`도 쓰지 않습니다.

### Supabase와 운영 데이터

운영 DB는 Vercel의 실서비스가 쓰는 Supabase 프로젝트 하나뿐입니다. 실수로 쓰면 되돌릴 방법이
마땅치 않으므로 아래를 지킵니다.

- **운영 DB에 쓰지 않습니다.** `supabase link`, `--remote`가 붙은 명령, `supabase db push`, `supabase migration repair`,
  SQL Editor·MCP를 통한 `insert`·`update`·`delete`·DDL 실행, Storage 파일 변경을 하지 않습니다. 적용은 사용자가 합니다.
- **로컬 DB는 자유롭게 씁니다.** `pnpm db:start`(로컬 Supabase 실행), `pnpm db:reset`(migration 전체 재적용 + seed),
  `pnpm db:test`(pgTAP), `pnpm db:types`(타입 생성)는 Docker 안의 로컬 DB만 대상으로 합니다.
- 운영 DB를 읽어야 하면(행 수, 정책 확인 등) 실행할 SQL을 먼저 보여 주고 사용자가 실행하거나 허락한
  뒤에만 읽기 전용으로 실행합니다.
- `.env.local` 등 실제 비밀값 파일을 읽거나 출력하지 않습니다. 필요한 변수 이름은 `.env.example`에서 확인합니다.
- schema 변경은 `pnpm exec supabase migration new <이름>`으로 **새 파일**을 만들어 추가합니다. 이미 적용된 migration 파일은
  수정하지 않습니다. 운영 DB 적용은 사용자가 하고, 적용 후 원격 migration 이력이 로컬 파일과 같은지 확인합니다.
- `lib/supabase/database.types.ts`는 생성 파일입니다. 직접 고치지 않고 migration을 바꾼 뒤 `pnpm db:types`로 다시 만듭니다.
- 새 migration에는 같은 이름의 rollback SQL을 `supabase/rollbacks/`에 함께 둡니다. 되돌릴 수 없는
  변경(데이터 삭제, 형 변환으로 정보 손실)이면 rollback 파일에 그 이유와 백업 방법을 적습니다.
- 새 table에는 같은 migration에서 RLS를 켜고 policy·grant를 명시합니다. 판단 기준은
  [REVIEW.md의 데이터·권한](review/REVIEW.md#데이터권한)입니다.

### 검증 및 완료

| 변경 종류 | 필요한 검증 |
| --- | --- |
| 문서만 변경 | `git diff --check`, 수정한 link·path·command·저장소 사실 확인 |
| 일반 application code | `pnpm lint`, `pnpm typecheck` |
| 기존 test가 있는 기능 | `pnpm lint`, `pnpm typecheck`, 해당 기능의 focused test(`pnpm test tests/<파일>`) |
| `features/*/model` 순수 로직 | 위에 더해 `pnpm test` 전체. 날짜·시간대 로직은 경계값(자정, 월말, KST↔UTC) test를 확인 |
| UI 또는 사용자 흐름 | `pnpm lint`, `pnpm typecheck`, 대상 흐름의 `pnpm test:e2e tests/e2e/<파일>`(로컬 Supabase 필요). E2E가 없으면 `pnpm dev`로 화면을 직접 확인하고 확인한 내용을 보고 |
| server action, 인증·권한, cache·revalidate | `pnpm lint`, `pnpm typecheck`, 관련 focused test, 그리고 [REVIEW.md의 데이터·권한](review/REVIEW.md#데이터권한) 항목을 스스로 점검한 결과 보고 |
| route 추가·삭제, `next.config.ts`, 정적 생성(`generateStaticParams`, `revalidate`) | 위 검증에 더해 `pnpm test:e2e`(production build를 로컬 Supabase로 띄워 실행) |
| Supabase migration | `pnpm db:reset`으로 전체 재적용, `pnpm db:test`, `pnpm db:types` 후 생성 타입 diff 확인. 권한을 바꿨으면 `supabase/tests/database/`에 허용·거부 test를 추가. rollback 파일과 운영 적용 전 확인할 SQL을 보고 |
| `data/attractions.json` | `pnpm places:check` |
| dependency·설정 변경(지시받은 경우) | CI(`.github/workflows/ci.yml`)와 같은 순서로 `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test`, `build` |

- `pnpm test:e2e`는 로컬 Supabase와 `supabase/seed.sql` 데이터로 실행되고, 운영 DB 주소면 시작하지 않습니다
  (`tests/e2e/local-supabase.ts`). 관리자 E2E는 seed의 로컬 전용 관리자 계정으로 로그인합니다.
- Auto-fix(`pnpm lint --fix`)는 사용자가 요청했거나 lint 오류가 확인된 경우에만 실행하고, 바뀐 내용을 검토합니다.
- 필요한 검증을 실행할 수 없으면 이유와 대신 확인한 근거를 알립니다.
- 변경과 무관한 기존 failure는 따로 알리고, 이를 고치려고 관련 없는 변경을 섞지 않습니다.
- test를 붙이려고 code를 옮기거나 re-export 경로를 만들지 않습니다. 일회성 확인 script는 저장소 밖에서만 실행합니다.

### Git

- commit은 사용자가 요청할 때만 만듭니다. push는 사용자가 채팅에서 직접 요청할 때만 합니다.
- `main`에 직접 commit하지 않고 작업 branch에서 진행합니다. PR 본문은
  [PR 템플릿](../.github/pull_request_template.md)을 따르고, 관련 결정 문서를 링크합니다.

### AI가 읽는 문서 작성

- AI가 읽는 문서의 정보는 원본을 하나만 둡니다. 새 원본은 [`.ai/` 구조](#ai-구조)의 해당 위치에 만듭니다.
- 연결 파일(`AGENTS.md`, `CLAUDE.md`)에는 내용을 쓰지 않습니다. 도구가 연결 파일에 내용을 추가하라고
  제안하면 해당 `.ai/` 원본에 반영합니다.
- 다른 파일에 원본이 있는 내용(`package.json` script, 설정값, route 목록, 코드 예시 등)은 복사하지 않고
  원본 경로를 안내합니다. 문서에는 원본에서 알 수 없는 정책, 의도, 판단 기준만 적습니다.

### Language

사용자가 읽는 설명과 report는 한국어로 씁니다. 기술 용어는 처음 나올 때 뜻과 선택 이유를 함께
설명합니다. Command, path, code, 기존 identifier는 영어 표기를 유지합니다.
