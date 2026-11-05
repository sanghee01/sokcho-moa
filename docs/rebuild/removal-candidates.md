# 덜어낼 후보

AI가 코드를 읽고 찾은 "지우거나 줄이거나 쪼갤 수 있는 것"의 목록입니다. **결정은 사용자가 합니다.**
1차 리팩토링(2026-11-05)에서 처리한 결과를 "결정" 칸에 적었습니다. 상세는 [refactor-1.md](refactor-1.md)에 있습니다.
AI는 근거와 판단 기준만 정리하고, 결정 전에는 코드를 지우거나 옮기지 않습니다.

- 결정하면 `docs/decisions/`에 결정 문서를 만들고, 아래 표의 "결정" 칸에 링크합니다.
- 수치(GA4, Search Console, 네이버 서치어드바이저)가 필요한 후보는 "필요한 수치" 칸에 적었습니다.
  이 저장소에는 실제 사용 지표가 없으므로 사용자가 확인해 알려 줍니다.
- 줄 수는 2026-11-05 `main`(85e8b44) 기준입니다.

## 한눈에 보기

| # | 후보 | 크기 | 지금 쓰이나 | 제안 방향 | 필요한 수치 | 결정 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | [`app/e2e-test/*` 페이지 3개](#1-appe2e-test-페이지-3개) | 페이지 3개 + harness 59줄 | E2E 3개 파일이 사용 | 대체 검증을 정한 뒤 판단 | 없음 | 1차에서 삭제, 실제 `/admin` E2E로 대체 |
| 2 | [migration SQL 문자열 검사 test 4개](#2-migration-sql-문자열-검사-test-4개) | 681줄 | CI에서 실행 | 대체 검증을 정한 뒤 판단 | 없음 | 1차에서 삭제, pgTAP 동작 test로 대체 |
| 3 | [`demo` 데이터 모드](#3-demo-데이터-모드) | `demo-data.ts` 280줄 + 분기 10여 곳 | E2E·CI build·unit test 3개가 의존 | 테스트 전략과 함께 결정 | 없음 | 1차에서 삭제, 로컬 Supabase + seed로 대체 |
| 4 | [캘린더](#4-캘린더) | 약 640줄 | **화면에서 이미 숨김**(2026-07-26부터) | 삭제 또는 되살리기 중 선택 | 거의 없음 | 1차에서 삭제(사용자 결정) |
| 5 | [토픽 SEO 페이지](#5-토픽-seo-페이지) | route 61줄 + 약 120줄 | 공개 중, sitemap 포함 | 수치를 보고 판단 | Search Console·서치어드바이저 `/topics/*` 노출·클릭 | 유지, 수치 확인 후 결정(사용자 결정) |
| 6 | [IndexNow](#6-indexnow) | 약 75줄 | 관리자 쓰기마다 호출 | 수치를 보고 판단 | 서치어드바이저 수집 현황 | 유지, 수치 확인 후 결정(사용자 결정) |
| 7 | [`components/admin/event-form.tsx`](#7-componentsadminevent-formtsx-쪼개기) | 455줄 | 사용 중 | 지우지 않고 쪼개기 | 없음 | 1차에서 4개 파일로 분리 |
| 8 | [`lib/supabase/browser.ts`](#8-libsupabasebrowserts) | 12줄 | **import하는 곳 없음** | 삭제 | 없음 | 1차에서 삭제 |
| 9 | [migration 전환기 대비 코드](#9-migration-전환기-대비-코드) | 약 25줄 | 운영 DB 상태에 따라 다름 | 운영 DB 확인 후 삭제 | 운영 DB에 해당 table·bucket이 있는지 | 1차에서 삭제(운영 대시보드로 table·bucket 존재 확인) |
| 10 | [적용된 migration을 다시 쓰는 장소 생성 script](#10-적용된-migration을-다시-쓰는-장소-생성-script) | script 1개 | CI `places:check` | 구조 변경 결정 필요 | 없음 | 1차에서 seed만 쓰도록 변경 |
| 11 | [DB에 남은 미사용 객체](#11-db에-남은-미사용-객체) | RPC 1개, index 3개 | 앱에서 호출 없음 | 새 migration으로 삭제 | 운영 DB에서 index 사용 통계(선택) | 1차 migration에 포함(RPC 1개, index 2개). 부분 index와 겹치는 tombstone index는 쓰임새가 달라 유지 |

---

## 1. `app/e2e-test/*` 페이지 3개

**무엇인가**: 관리자 화면 부품을 로그인 없이 브라우저에서 띄우기 위한 test 전용 페이지입니다.

| 페이지 | 띄우는 component | 쓰는 E2E |
| --- | --- | --- |
| `app/e2e-test/event-form/page.tsx` | `components/admin/event-form.tsx` | `tests/e2e/admin-event-form.spec.ts` |
| `app/e2e-test/admin-status/page.tsx` | `components/admin/status-controls-e2e-harness.tsx`(59줄) | `tests/e2e/admin-status-layout.spec.ts` |
| `app/e2e-test/header/page.tsx` | `components/header-navigation.tsx` | `tests/e2e/header-navigation.spec.ts` |

**왜 있었나(기존 구현 추정)**: E2E는 `demo` 모드로 돌아 Supabase 로그인이 없습니다. 그래서 `/admin` 화면을
직접 열 수 없어 부품만 따로 띄운 것으로 보입니다.

**지금 비용**

- 운영 노출을 막는 코드가 세 곳에 흩어져 있습니다: `proxy.ts:6-12`(운영에서 404), `app/robots.ts:10`,
  `lib/analytics/google-analytics.ts:2`.
- 실제 `/admin` 페이지(권한 확인, server action 연결)는 검증하지 않습니다. 부품만 검증합니다.

**지우면 잃는 것**: 관리자 행사 폼의 필수 입력·이미지 업로드 표시·저장 후 메시지, 관리자 상태 버튼
배치, 헤더 메뉴의 브라우저 검증.

**판단 기준**

- 관리자 폼을 브라우저에서 검증할 필요가 있는가? 운영자가 나 혼자라면 수동 확인으로 충분한가?
- 대체 수단이 있는가? (예: 로컬 Supabase + 테스트 관리자 계정으로 실제 `/admin` E2E, 또는 component test)
- 헤더는 모든 공개 페이지에 있는데 왜 따로 띄웠는가? `public-event-flow.spec.ts`로 대체 가능한가?

**질문**: 헤더 harness가 필요했던 이유를 기억하나요? 기억나지 않으면 "이유 확인 불가"로 두고 판단합니다.

## 2. migration SQL 문자열 검사 test 4개

**무엇인가**: migration `.sql` 파일을 텍스트로 읽어 특정 문장이 들어 있는지, 순서가 맞는지 검사합니다.

| test | 줄 수 | 읽는 migration |
| --- | --- | --- |
| `tests/atomic-event-update-migration.test.ts` | 94 | `20260804014903_atomic_event_updates.sql` (+ `lib/actions/admin/event.ts`) |
| `tests/event-deletion-suppression-migration.test.ts` | 428 | `20260803015356_prevent_deleted_event_recollection.sql` |
| `tests/production-occurrence-migration.test.ts` | 93 | `202607200002_backfill_event_occurrences.sql`, `supabase/rollbacks/20260720_event_occurrences.sql` |
| `tests/public-submission-rate-limit-migration.test.ts` | 66 | `20260804020600_public_submission_rate_limits.sql` |

**한계**

- SQL이 실제로 실행되는지, RLS가 실제로 막는지는 확인하지 못합니다. 문장이 있으면 통과합니다.
- 줄바꿈·별칭만 바꿔도 깨집니다. 반대로 같은 문장을 뒤 migration에서 되돌려도 통과합니다.
- 이미 적용되어 바뀌지 않을 파일을 검사하므로, 회귀(나중 변경이 기존 동작을 깨는 것)를 거의 막지 못합니다.

**지우면 잃는 것**: 지금 저장소에서 DB 쪽을 자동으로 검사하는 유일한 수단입니다. 로컬 Supabase
환경(`supabase/config.toml`)이 없고 Supabase CLI도 설치되어 있지 않습니다.

**판단 기준**

- 대체 검증을 도입할 것인가? 예: Supabase CLI + Docker로 로컬 DB를 띄워 RLS·RPC를 실제로 호출하는 test
  (pgTAP 등). 이는 도구·의존성 추가라 별도 결정이 필요합니다.
- 대체 없이 지운다면, migration 리뷰를 [REVIEW.md의 Migration](../../.ai/review/REVIEW.md#migration) 체크리스트로
  대신하는 것을 받아들일 수 있는가?

## 3. `demo` 데이터 모드

**무엇인가**: `NEXT_PUBLIC_DATA_MODE=demo`이면 Supabase 대신 `lib/data/demo-data.ts`의 샘플 행사로 화면을
그립니다. 환경 변수가 없으면 기본값이 `demo`입니다(`lib/config/env.ts:4`).

**같은 이름의 다른 개념**: DB의 `events.is_demo` 컬럼(운영 DB 안의 샘플 행)과는 다릅니다. 공개 조회는
`is_demo = false`로 거릅니다(`lib/data/events.ts:18`). 이 컬럼도 함께 정리할지 따로 판단합니다.

**의존하는 곳**

- E2E 전체: `playwright.config.ts`의 `webServer`가 `demo`로 실행
- CI build: `.github/workflows/ci.yml`의 build 단계가 `demo`
- unit test 3개: `filters`, `related-events`, `geo` test가 `getDemoEvents()`를 fixture로 사용
- 분기: `lib/supabase/*` 3곳, `lib/data/events.ts`, `lib/admin/auth.ts`, `app/admin/login/page.tsx`,
  `components/event-browse-page.tsx:97`, `proxy.ts:23`

**지우면 생기는 일**: E2E와 CI build가 실제 Supabase(또는 로컬 Supabase)를 필요로 합니다. unit test는
fixture를 `tests/` 안으로 옮기면 됩니다.

**판단 기준**

- 코드 경로가 둘(demo/supabase)이라 E2E가 운영 경로를 검증하지 않는 비용 vs 자격증명 없이 화면을
  띄우고 CI를 돌리는 이점
- 1·2번 후보와 함께 "테스트를 어디서 무엇으로 돌릴지"를 한 번에 결정하는 편이 낫습니다.

## 4. 캘린더

**무엇인가**: 행사를 월별 달력으로 보여 주는 기능입니다. `lib/domain/calendar.ts`(307줄),
`components/event-calendar.tsx`(329줄), `tests/calendar.test.ts`.

**현재 상태(코드로 확인한 사실)**

- `components/event-calendar.tsx`를 import하는 곳이 없습니다. 화면에 나오지 않습니다.
- `/calendar`는 목록으로 redirect합니다(`app/calendar/page.tsx`, 주석: 캘린더 공개 화면을 잠시 숨김).
- E2E는 `test.describe.skip("캘린더 공개 탭을 가독성 개선 전까지 임시로 숨김")`으로 꺼져 있습니다.
- 숨긴 시점은 commit `838881f`(2026-07-26)입니다. 3개월 넘게 숨겨진 상태입니다.
- 그런데도 행사 저장 때 `revalidatePath("/calendar")`를 호출하고(`lib/actions/admin/event.ts:110`),
  GA4 설계에 `calendar_month_changed`·`calendar_date_selected`가 남아 있습니다.

**판단 기준**

- 다시 보여 줄 계획이 있는가? 있다면 "가독성 개선"이 무엇이었는지 정의할 수 있는가?
- 없다면 git history에 남으므로 지워도 되살릴 수 있습니다. 남겨 두면 test·typecheck·리뷰 대상만 늘어납니다.
- 지운다면 `/calendar` redirect(기존 북마크 보호)는 남길지 따로 정합니다.

## 5. 토픽 SEO 페이지

**무엇인가**: 카테고리별 검색 유입용 페이지 `/topics/[topic]` 6개(공연·축제·체험·교육·전시·기타)입니다.

- `app/(event-browse)/topics/[topic]/page.tsx`, `lib/domain/event-topic.ts`(78줄),
  `lib/seo/topic-structured-data.ts`(45줄)
- `proxy.ts:14-19`가 없는 토픽을 404로 바꿉니다. 페이지에도 `dynamicParams = false`가 있지만, `searchParams`를 써서
  build 결과는 동적 route입니다(`pnpm build` 출력의 `ƒ /topics/[topic]`). 두 장치가 각각 필요한지 확인이 필요합니다.
- 홈에서 `?category=`로 거르면 canonical(검색엔진에 알리는 대표 주소)이 토픽 주소가 됩니다
  (`app/(event-browse)/page.tsx`). 토픽을 지우면 홈 metadata도 함께 바꿔야 합니다.
- 행사 저장·`/api/revalidate` 때마다 토픽 6개 경로를 다시 생성합니다.

**필요한 수치**: Search Console·네이버 서치어드바이저에서 `/topics/*`의 최근 3개월 노출·클릭,
GA4에서 `/topics/*` 랜딩 세션 수.

**판단 기준**: 검색 유입이 의미 있게 있으면 유지. 거의 없으면 홈의 카테고리 필터만 남기고 삭제.
"의미 있다"의 기준(예: 전체 랜딩의 몇 %)을 먼저 정합니다.

**질문**: proxy와 `dynamicParams` 중 하나만 남겨도 되는지, proxy 쪽을 추가한 이유를 기억하나요?

## 6. IndexNow

**무엇인가**: 행사를 공개·수정·삭제할 때 네이버 서치어드바이저에 "이 주소가 바뀌었다"고 알리는 기능입니다.
`lib/seo/indexnow.ts`(63줄), `app/indexnow-key.txt/route.ts`, 호출부 `lib/actions/admin/event.ts:254, 280, 320`.

- 응답 실패는 경고 로그만 남기고 무시합니다. 동작 여부를 코드만으로는 확인할 수 없습니다.
- key가 소스에 리터럴로 있습니다(`lib/seo/indexnow.ts:5`). IndexNow key는 공개 파일로 내보내는 값이라
  비밀값은 아닙니다.

**필요한 수치**: 서치어드바이저의 수집 요청·색인 현황, Vercel 로그의 `IndexNow` 경고 빈도.

**판단 기준**: 행사 수와 갱신 빈도가 작으면 sitemap만으로 충분한가? 색인이 빨라진 근거가 있는가?

## 7. `components/admin/event-form.tsx` 쪼개기

**지우지 않고 쪼갤 대상**입니다. 한 파일에 아래가 함께 있습니다.

| 부분 | 위치 | 내용 |
| --- | --- | --- |
| 작은 표시 부품 | 39-97줄 | `RequiredMark`, `SectionHeading`, `FieldHelp`, `DateTimeField` |
| 이미지 업로드 | 99-232줄 | `ImageUploadField`: 별도 server action(`uploadEventImageAction`), 미리보기, 파일 검증, effect 2개 |
| 행사 폼 본체 | 233-455줄 | 카테고리·대상·일정 방식(연속/회차)·회차 목록 state와 다섯 개 섹션 |

**판단 기준**

- 관리자 영역은 재구축 순서의 마지막입니다. 그 전에 일정 모델(연속/회차)과 이미지 업로드 흐름을
  앞 영역에서 이해하고 결정한 뒤 쪼개는 편이 안전합니다.
- 쪼개는 단위는 "따로 이해·검증할 수 있는가"로 정합니다. 예: 이미지 업로드, 회차 편집.
- 1번 후보(e2e harness)를 지우면 이 폼의 브라우저 검증도 함께 사라집니다. 순서를 정합니다.

## 8. `lib/supabase/browser.ts`

브라우저용 Supabase client를 만드는 파일인데, 저장소 어디에서도 import하지 않습니다(`grep` 결과 0건).
지금 모든 Supabase 접근은 서버에서 일어납니다. 지우면 "브라우저에서 Supabase를 직접 부르지 않는다"는
구조가 코드로도 드러납니다. 이 원칙을 [CONVENTIONS.md의 Supabase client 선택](../../.ai/CONVENTIONS.md#supabase-client-선택)
규칙으로 정할지 함께 판단합니다.

## 9. migration 전환기 대비 코드

migration이 운영 DB에 아직 적용되지 않았을 때를 대비한 코드입니다. 적용이 끝났다면 필요 없습니다.

| 위치 | 하는 일 | 확인할 것 |
| --- | --- | --- |
| `lib/data/events.ts:20-36` | `event_occurrences` 관계가 없으면 회차 없이 다시 조회 | 운영 DB에 `event_occurrences`가 있는지 |
| `lib/supabase/service.ts:21-34` | `feedback-images` bucket과 `site_feedback.image_path` 컬럼이 있는지 5분마다 확인 | 운영 DB에 둘 다 있는지 |

**필요한 확인**: Supabase 대시보드에서 위 table·컬럼·bucket이 있는지 사용자가 확인합니다(AI는 운영 DB를 조회하지 않습니다).

## 10. 적용된 migration을 다시 쓰는 장소 생성 script

`pnpm places:generate`(`scripts/generate-place-assets.mjs`)는 `data/attractions.json`으로
`supabase/seed.sql`과 **이미 적용된** `supabase/migrations/202607200003_expand_places.sql`을 다시 씁니다.
CI의 `pnpm places:check`는 두 파일이 JSON과 같은지 검사합니다.

**문제**: 장소를 추가해 script를 돌리면 migration 파일은 바뀌지만, 이미 적용된 운영 DB에는 다시 실행되지
않습니다. 코드와 운영 DB가 어긋납니다.

**판단 기준**: 장소 데이터를 schema(migration)로 관리할지, 관리자 화면(`/admin/places`)이나 seed로만
관리할지. 장소 원본을 JSON과 DB 중 어디에 둘지 먼저 정합니다.

## 11. DB에 남은 미사용 객체

[database.md의 확인이 필요한 지점](../database.md#확인이-필요한-지점)에서 찾은 것입니다. 지우려면 새 migration이
필요하고, 적용은 사용자가 합니다.

| 객체 | 근거 | 지우지 않을 때의 비용 |
| --- | --- | --- |
| `replace_event_occurrences` RPC | `202607200001_event_occurrences.sql:46-75`에서 만들고, 행사 저장 RPC로 대체된 뒤 앱 호출 0건 | 로그인 사용자 누구나 실행 권한이 있고 `search_path = public`이 고정되지 않음. 내부에서 `is_admin()`을 검사하므로 실제 위험은 낮음 |
| `event_sources_event_idx` | unique `(event_id, provider, original_url)`의 첫 컬럼과 겹침 | 쓰기마다 index 하나를 더 갱신 |
| `event_deletion_identities_tombstone_id_idx` | unique `(tombstone_id, identity_key)`의 첫 컬럼과 겹침 | 위와 같음 |
| `event_deletion_tombstones_deleted_at_idx` | 부분 index `..._active_deleted_at_idx`와 같은 컬럼·정렬 | 위와 같음 |

**판단 기준**: 같은 이유로 `20260804014934_remove_redundant_occurrence_index.sql`이 index 하나를 이미 지웠습니다.
그 기준을 이어 갈지, 데이터가 적어 비용이 무시할 만하니 그대로 둘지 정합니다.

---

## 코드 밖 정리 후보(Git에 없음)

아래는 Git에 포함되지 않은 로컬 폴더라 저장소 크기·배포에는 영향이 없습니다. 작업 공간을 헷갈리지 않게
정리할지만 판단합니다: `apps/web/`(빌드 산출물과 빈 `src`), `apps/mobile/`, `.playwright-cli/`, `output/`,
`test-results/`, 빈 `my-docs/`, `docs/goals/`(기존 AI 작업 기록).

이 중 `apps/web/.next/`는 실제 작업에 영향을 줍니다. `eslint.config.mjs`가 루트 `.next/**`만 제외하므로, 로컬에서
`pnpm lint`를 돌리면 이 폴더의 빌드 산출물에서 오류 2천여 개가 나와 실패합니다(2026-11-05 확인, CI에는 이 폴더가 없어 영향 없음).
폴더를 지우는 것과 lint 설정을 바꾸는 것 중 무엇을 할지 정합니다. 설정 변경은 [RULES.md의 의존성과 도구 설정](../../.ai/RULES.md#의존성과-도구-설정)에 따라 사용자 지시가 필요합니다.
