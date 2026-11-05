# 1차 리팩토링

AI로 빠르게 만든 기존 구현에서 문제와 코드 스멜을 한 번에 걷어 내는 단계입니다. 이 단계는 사용자가
범위를 정하고 AI가 실행했습니다(2026-11-05). 구조 지도는 이 단계가 끝난 코드를 기준으로 다시 그리고,
그 뒤의 2차 리팩토링은 [재구축 루프](loop.md)로 사용자가 한 영역씩 판단하며 진행합니다.

목표 구조와 근거는 [target-architecture.md](target-architecture.md)에 있습니다.

## 사용자가 정한 범위

| 결정 | 내용 |
| --- | --- |
| 캘린더 | 삭제. `/calendar`는 목록으로 redirect만 남김 |
| 토픽 SEO·IndexNow | 유지하고 구조만 정리. 삭제 여부는 검색 유입 수치를 본 뒤 결정 |
| 로컬 Supabase | 도입(Supabase CLI + Docker). migration을 실제로 실행해 검증 |
| DB 변경 migration | 1차에 포함. 파일만 작성하고 운영 적용은 사용자가 함 |

## 운영 환경 확인 결과(2026-11-05, 대시보드 읽기 전용)

| 항목 | 확인한 사실 | 영향 |
| --- | --- | --- |
| Supabase API 키 | publishable·secret 키(`sb_publishable_`, `sb_secret_`)가 이미 발급돼 있음. 대시보드 안내: legacy 키는 2027년 초 폐기 | 코드의 env 이름을 `SUPABASE_SECRET_KEY`로 바꾸고, Vercel에 같은 이름으로 secret 키를 넣으면 됨 |
| Vercel 환경 변수 | `SUPABASE_SERVICE_ROLE_KEY`, `SUBMISSION_RATE_LIMIT_HMAC_SECRET`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_DATA_MODE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_KAKAO_MAP_JS_KEY` | `SUPABASE_SERVICE_ROLE_KEY`에 든 값이 legacy JWT인지 secret 키인지는 값을 열지 않아 모름. `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`는 코드에서 쓰지 않음(지도는 네이버로 바뀜) → 삭제 후보 |
| JWT 서명 키 | 현재 키 ECC(P-256), 이전 키 HS256 | 비대칭 키라 `getClaims()`가 Auth 서버 호출 없이 서명을 검증함 |
| Postgres | 17.6 | 로컬 `config.toml`의 `major_version = 17`과 같음 |
| migration 이력 | 원격 이력에는 `20260803015356` 이후 7개만 있음. 앞선 12자리 이름 13개는 이력에 없음(SQL Editor 등으로 적용한 것으로 보임) | `supabase db push`를 쓰기 전에 13개를 `supabase migration repair --status applied`로 이력에 등록해야 함. 사용자가 실행 |
| `event_reports.source_url` | 운영 DB는 `NULLABLE` | 새 DB(`not null`)와 다름. 정리 migration 4번이 맞춤. 적용 전 null 행이 없는지 확인 필요(제보 2건) |
| Storage | `feedback-images`(비공개, 3MB), `event-images`(공개, 3MB) | 의견 이미지 bucket 존재 확인 코드는 필요 없음 |
| 테이블 | 9개. `event_occurrences` 153행 | 회차 table 없을 때의 fallback 코드는 필요 없음 |

## 작업 목록

상태: ✅ 완료 · ⏳ 진행 중 · ⛔ 막힘(이유 적음) · ⏭ 2차로 넘김

### 저장소 정리

| # | 작업 | 이유 | 상태 |
| --- | --- | --- | --- |
| 1 | 레거시 `.gitignore` 정리, `docs/goals/`는 `.git/info/exclude`로 | 이전 AI 작업 도구의 흔적. `AGENTS.md`를 숨기던 규칙도 제거 | ✅ |
| 2 | 소스 없는 로컬 `apps/`(node_modules 733MB) 휴지통 이동, `pnpm-workspace.yaml` 삭제 | `pnpm lint`가 `apps/web/.next`를 검사해 실패. 앱이 하나뿐인데 pnpm이 모노레포로 인식 | ✅ |
| 3 | 캘린더 삭제(컴포넌트·도메인·test·E2E·GA 이벤트·`/calendar` 무효화) | 2026-07-26부터 화면에서 숨겨진 채 남은 코드 640줄 | ✅ |
| 4 | 미사용 `lib/supabase/browser.ts` 삭제 | import 0건 | ✅ |

### 의존성

| # | 작업 | 이유 | 상태 |
| --- | --- | --- | --- |
| 5 | `next`·`eslint-config-next` 16.2.12 → 16.4.5 | 2026-11-03 보안 릴리스가 패치 버전으로 16.4.5만 명시 || ✅ |
| 6 | `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.119.0 | 패치 업그레이드 || ✅ |
| 7 | `supabase` CLI 3.0.0 devDependency, `supabase/config.toml` | 로컬 Supabase 도입 | ✅ |

### 구조

| # | 작업 | 이유 | 상태 |
| --- | --- | --- | --- |
| 8 | `features/<도메인>`으로 이동, `lib/`는 인프라만 | 행사 코드가 `lib/domain`, `lib/data`, `lib/actions/admin`, `lib/admin`, `components` 다섯 곳에 흩어져 있음 || ✅ |
| 9 | 조회 모듈에 `server-only`, Supabase client 이름을 역할대로(`public`/`server`/`admin`) | 공식 DAL 권장. 공개 조회 모듈에 표시가 없었음 || ✅ |
| 10 | cache tag와 무효화 경로를 도메인별 `cache.ts` 한 곳으로 | 같은 경로 목록이 action 두 곳과 `/api/revalidate`에 따로 있었음 || ✅ |
| 11 | 관리자 쓰기 후 `updateTag` | `revalidateTag(…, "max")`는 오래된 값을 먼저 보여 줘 저장 직후 이전 내용이 보일 수 있음 || ✅ |
| 12 | action 공통 helper(검증 → 인가), 오류 응답에 DB 오류 원문 노출 제거 | action마다 검증·인가 순서와 반환 형태가 달랐고, 일부는 DB 오류 메시지를 그대로 throw || ✅ |
| 13 | `components/admin/event-form.tsx`(455줄) 쪼개기 | 이미지 업로드·회차 편집·폼 본체가 한 파일 || ✅ |

### 보안·설정

| # | 작업 | 이유 | 상태 |
| --- | --- | --- | --- |
| 14 | 서버 비밀값을 `server-only` env 모듈 한 곳에서 zod 검증 | 비밀값을 파일마다 `process.env`로 직접 읽음 || ✅ |
| 15 | `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY` | legacy 키 2026년 말 폐기 예정. Vercel 환경 변수는 사용자가 바꿔야 함 || ✅ |
| 16 | 개발 환경에서 service-role 키를 HMAC 키로 재사용하던 fallback 제거 | 비밀값 하나를 두 용도로 쓰지 않기(Supabase 권장) || ✅ |
| 17 | `proxy.ts`가 Supabase 캐시 헤더를 응답에 적용, 관리자 확인을 요청 단위로 1회만 | 공식 가이드와 다름. layout·page가 각각 Auth 서버를 호출 || ✅ |
| 18 | `/api/revalidate` 비밀값 비교를 timing-safe 비교로 | 문자열 `!==` 비교 || ✅ |
| 19 | 토픽 404 처리를 페이지 `notFound()` 하나로 | proxy와 `dynamicParams` 두 곳에서 같은 일을 함 | ⏭ 판단 바뀜: 토픽 페이지는 `loading.tsx`로 스트리밍되어 `notFound()`로는 HTTP 404를 줄 수 없음. proxy가 렌더 전에 404를 주는 이유가 있어 유지. 대신 proxy가 공개 토픽 요청마다 하던 세션 갱신을 `/admin`에만 하도록 고침 |
| 20 | migration 전환기 대비 코드 삭제(`event_occurrences` 없을 때 fallback, 의견 이미지 bucket 존재 확인) | 해당 migration은 2026-07에 적용됨 || ✅ |
| 21 | `places:generate`가 적용된 migration을 다시 쓰지 않게 | 운영 DB에 반영되지 않는 migration 변경을 만듦 || ✅ |

### 로컬 Supabase가 필요한 작업

| # | 작업 | 이유 | 상태 |
| --- | --- | --- | --- |
| 22 | 새 migration `20261105090000_cleanup_unused_objects.sql` + rollback | 미사용 RPC·중복 index·남은 insert 권한 정리, 운영·새 DB schema 차이 해소 | ✅ 로컬에서 migration 21개 전체 재적용 성공, pgTAP으로 결과 확인. 운영 적용은 사용자 |
| 23 | `supabase gen types`로 DB 타입 생성, `Record<string, unknown>` 매핑 제거 | 컬럼 오타·schema 변경을 typecheck가 잡게 | ✅ 타입을 붙이자 재수집 제외 RPC 인자 불일치 1건이 드러남 |
| 24 | migration 문자열 검사 test 5개 → pgTAP RLS·RPC 동작 test | 문자열이 있는지만 확인하고 실제 권한은 확인하지 못함 | ✅ 3개 파일 30개 검사. anon의 조회·수정은 권한 오류가 아니라 RLS로 0행이 된다는 사실을 test가 드러냄 |
| 25 | `demo` 모드 제거, E2E를 로컬 Supabase + seed로, production build에서 실행 | 코드 경로가 둘이라 E2E가 운영 경로를 검증하지 못함 | ✅ E2E 48개 중 47개 통과, 1개는 의도한 건너뜀(DB를 바꾸는 관리자 test는 데스크톱만) |
| 26 | `app/e2e-test/*` harness 삭제, 실제 `/admin`을 테스트 관리자 계정으로 E2E | 로컬 DB에 관리자를 seed하면 harness가 필요 없음 | ✅ E2E 48개 중 47개 통과, 1개는 의도한 건너뜀(DB를 바꾸는 관리자 test는 데스크톱만) |

### 2차로 넘긴 것

| 항목 | 이유 |
| --- | --- |
| Cache Components 전환 | [목표 구조](target-architecture.md#1차에서-하지-않는-것과설계) 참고 |
| 재공개 때 `published_at`이 바뀌는 동작 | 제품 동작 결정이 필요 |
| 조회수 증가가 `updated_at`을 바꾸는 trigger | 지금 앱이 `updated_at`을 읽지 않음. 쓰임새를 정한 뒤 판단 |
| 트리거 전용 `security definer` 함수를 `private` schema로 이동 | pgTAP test를 갖춘 뒤 |

## 결과(2026-11-05)

| 검증 | 결과 |
| --- | --- |
| `pnpm lint`, `pnpm typecheck` | 통과 |
| `pnpm test`(Vitest) | 34개 파일, 198개 통과 |
| `pnpm db:reset` | migration 21개 + seed 전체 재적용 성공 |
| `pnpm db:test`(pgTAP) | 3개 파일 30개 검사 통과 |
| `pnpm test:e2e`(production build + 로컬 Supabase) | 47개 통과, 1개 의도한 건너뜀 |
| `pnpm places:check` | 통과 |

- 앱 코드: 8,422줄 → 7,374줄(생성 타입 334줄 제외).
- 1차에서 새로 드러난 사실: 운영 DB와 새 DB의 `event_reports.source_url` 차이, Supabase 기본 grant 때문에 select·update를 막는 것은
  RLS라는 점, proxy가 공개 토픽 요청마다 세션을 갱신하던 낭비, E2E 기대값과 seed 데이터가 서로 어긋나 있던 점.

## 운영 반영 상태(2026-11-05)

| 할 일 | 상태 |
| --- | --- |
| Vercel에 `SUPABASE_SECRET_KEY` 추가(Production) | ✅ 사용자가 추가 |
| Vercel의 `SUPABASE_SERVICE_ROLE_KEY`·`NEXT_PUBLIC_DATA_MODE`·`NEXT_PUBLIC_KAKAO_MAP_JS_KEY` 삭제 | ✅ 사용자가 삭제 |
| 운영 DB `event_reports.source_url` null 행 확인 | ✅ 0건(전체 2건) |
| `20261105090000_cleanup_unused_objects.sql` 운영 적용 | ✅ SQL Editor에서 한 트랜잭션으로 적용. 적용 후 not null·RPC 삭제·index 삭제·insert 권한 회수 확인 |
| 원격 migration 이력 맞추기 | ✅ 이력에 없던 13개와 정리 migration을 `supabase_migrations.schema_migrations`에 등록. 이력 21개 = 로컬 파일 21개 |
| 새 코드 배포 | ⏳ 아직. `main`에 합치면 운영 배포 |

주의: 환경 변수 변경은 이미 배포된 버전에는 적용되지 않습니다. 지금 운영 중인 버전은 예전 변수로 계속 동작합니다.
대신 이 상태에서 **예전 `main` 코드를 다시 배포하면** `NEXT_PUBLIC_DATA_MODE`가 없어 샘플(demo) 화면으로 바뀌고, 제보·의견 접수도 막힙니다.
다음 운영 배포는 이 branch를 합친 코드여야 합니다. `SUPABASE_SECRET_KEY`는 Production에만 있으므로, Preview 배포에서는 제보·의견 접수가 "준비 중"으로 보입니다.
