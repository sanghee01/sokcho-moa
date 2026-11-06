# Review Guidelines

리뷰 에이전트가 **무엇을 어떤 근거로 지적할지** 정하는 리뷰 정책 원본입니다.

구현 규칙의 원본은 이 문서가 아닙니다. 규칙 위반을 지적할 때는 아래 원본의 해당 절을
제목 링크로 인용하고, 규칙 본문을 이 문서에 복제하지 않습니다.

| 규칙 | 원본 |
| --- | --- |
| 코드 규칙(사용자가 결정한 것만) | [루트 AGENTS.md의 코드 규칙](../../AGENTS.md#코드-규칙)과 폴더별 `AGENTS.md` |
| 화면 설계(토큰, 배치, 컴포넌트) | [DESIGN.md](../DESIGN.md) |
| 작업 원칙, 검증, 운영 데이터 안전 | [루트 AGENTS.md](../../AGENTS.md), [supabase/AGENTS.md](../../supabase/AGENTS.md) |
| 라우트·데이터 흐름·테이블 권한 | [architecture.md](../../docs/architecture.md) |
| 알려진 오탐과 적용 조건 | [false-positives.md](false-positives.md) |

> **PR 본문의 `👀 Review Point` 참고**: PR 본문에 `👀 Review Point` 섹션이 있으면, 그 항목은
> **작성자가 직접 리뷰를 요청한 지점**입니다. 해당 항목을 **반드시 함께 점검**하고, 관련 발견이
> 있으면 어떤 항목에 대한 것인지 적습니다. "이상 없음"으로 확인한 항목은 그 근거(읽은 파일·검색
> 결과)를 [리뷰 요약](#근거-기준)에 남깁니다.

---

## 반드시 지적할 것

### 데이터·권한

이 서비스의 권한은 Supabase RLS(Row Level Security: 행 단위로 누가 읽고 쓸 수 있는지 DB가
검사하는 기능)와 서버 코드가 함께 지킵니다. service-role client는 RLS를 통과하지 않으므로, 이 client를
쓰는 코드에서는 서버 코드가 유일한 방어선입니다.

- **RLS 누락**: 새 table·view를 만들면서 같은 migration에서 `enable row level security`를 하지 않은
  경우. RLS를 켰지만 `anon`·`authenticated`에 쓰기를 `using (true)`·`with check (true)`로 열어 둔 경우.
- **service-role client 노출 경로**: `createServiceRoleSupabaseClient`(또는 `SUPABASE_SERVICE_ROLE_KEY`)를
  `"use client"` 파일, 또는 client component가 import하는 모듈에서 사용한 경우. 이 client를 쓰는
  모듈에 `import "server-only"`가 없어 client bundle로 들어갈 수 있는 경우.
- **RLS를 우회하는 쓰기의 방어 누락**: service-role client로 사용자 입력을 쓰는데 Zod 검증이나
  [요청 제한](../../docs/architecture.md#방문자-쓰기제보의견)이 빠진 경우.
- **server action 입력 검증 누락**: `"use server"` 함수가 `FormData`·인자를 Zod `safeParse` 없이
  DB 쓰기에 쓰는 경우. server action은 화면 밖에서도 누구나 호출할 수 있는 공개 HTTP endpoint입니다.
- **관리자 권한 확인 누락**: 관리자 쓰기 action·route에서 `requireAdmin()`을 호출하지 않은 경우.
  RLS가 막아 주더라도, 같은 함수가 나중에 service-role client로 바뀌면 바로 열립니다.
- **route handler 인증 누락**: `app/api/**`에 쓰기·캐시 무효화가 있는데 인증 확인이 없는 경우.
- **`NEXT_PUBLIC_`로 secret 노출**: `NEXT_PUBLIC_` 접두사 변수는 브라우저 bundle에 그대로 들어갑니다.
  service-role key, HMAC secret, `REVALIDATE_SECRET` 같은 서버 비밀값에 붙은 경우.
  publishable key는 해당하지 않습니다([false-positives.md](false-positives.md)).
- **DB 함수 권한**: `security definer` 함수(만든 사람 권한으로 실행되어 RLS를 건너뛰는 함수)에
  `set search_path`가 없거나, `revoke execute ... from public` 없이 만들어 `anon`이 호출할 수 있는 경우.
- **Storage**: 업로드 파일의 형식·크기 검증이 서버에 없거나, 비공개 bucket 파일을 public URL로 내보내는 경우.

### Migration

- **rollback 없는 migration**: 새 migration에 대응하는 `supabase/rollbacks/` 파일이 없고, 되돌릴 수 없는
  이유도 적혀 있지 않은 경우.
- **적용된 migration 수정**: 이미 `main`에 있는 migration 파일을 고친 diff. 운영 DB에는 반영되지 않아
  코드와 DB가 어긋납니다. 새 migration으로 바꿔야 합니다.
- **데이터를 지우거나 형을 바꾸는 migration**에 백업·검증 절차가 PR에 없는 경우.
- 뒤 migration에서 `create or replace`·`drop policy`로 덮이는 객체를 앞 migration 기준으로 판단한 경우는
  지적하지 않습니다. 항상 최종 상태 기준으로 봅니다.

### 캐시·revalidate

- **쓰기 후 캐시 만료 누락**: 공개 화면에 보이는 데이터(`events`, `event_occurrences`, `places`)를 바꾸는
  action이 도메인의 `cache.ts`(`expirePublicEvents`, `expirePublicPlaces`)를 호출하지 않은 경우. 공개 목록은 최대
  5분 동안 이전 값으로 보입니다. server action에서 `updateTag` 대신 `revalidateTag(…, "max")`를 써서 저장한 사람이
  이전 값을 보게 되는 경우도 포함합니다.
- 관리자 화면(`/admin`)만 바뀌는 쓰기에서 공개 tag를 무효화하지 않은 것은 지적하지 않습니다.

### 런타임 에러

- Supabase 호출의 `{ data, error }`에서 `error`를 확인하지 않고 `data`를 쓰는 경우
- `.single()`이 0건일 때의 오류를 처리하지 않아 정상 상황(삭제된 행 등)에서 500이 나는 경우
- Server Component 렌더 중 쿠키를 쓰는 경우
- 날짜 비교·날짜 키를 서버 기본 시간대로 만드는 경우. Vercel 서버는 UTC라 한국 날짜와 하루 어긋날 수 있습니다.
- Promise rejection 미처리, 빈 배열 인덱스 접근

### 비즈니스 로직

- **공개 조회 필터 누락**: 공개 화면 조회에서 `review_status = 'published'`나 `is_demo = false`가 빠져
  검수 전·샘플 행사가 노출되는 경우
- PR 설명의 의도와 코드 동작이 다른 경우
- **결정 범위 밖 변경**: 삭제·리팩토링·구조 변경이 PR 본문에 적힌 결정의 범위를 넘는 경우
  ([작업 원칙](../../AGENTS.md#작업-원칙))
- 도달할 수 없는 코드 경로, 아무 동작도 하지 않는 버튼
- 기존 유사 흐름에 GA4 이벤트가 있는데 새 흐름에 빠진 경우([analytics-events.md](../../docs/analytics-events.md))

### 화면·반응형

이번 PR이 새로 쓰거나 고친 화면 코드에만 적용합니다. 아직 개편 전인 기존 화면은 지적하지 않습니다.

- **모바일에서 깨지는 배치**: 360px 폭에서 가로로 넘치거나, 고정 폭(`w-[480px]` 등)·줄바꿈 금지(`whitespace-nowrap`)로
  글자가 화면 밖으로 나가는 경우
- **결정 정보가 첫 화면 밖으로 밀림**: 행사 상세에서 날짜·장소·주요 버튼보다 앞에 큰 요소를 새로 넣어
  [DESIGN.md의 페이지 구조](../DESIGN.md#페이지-구조)를 어기는 경우
- **토큰 대신 원색·임의 값**: [AGENTS.md의 코드 규칙](../../AGENTS.md#코드-규칙) 화면·스타일 위반. Minor로 분류합니다
- **접근성 이름 변경**: E2E가 찾는 `navigation`·`search`·`region`의 이름을 test 변경 없이 바꾼 경우
- **터치 영역 부족**: 누를 수 있는 요소가 44px보다 작고 여백으로 보완하지 않은 경우
- **한 화면 primary 버튼 2개 이상**, 한 항목 배지 3개 이상([DESIGN.md의 Components](../DESIGN.md#components))

### 타입 안전성

- `as any`, 근거 없는 `as` 단언으로 Supabase 응답 형태를 가정하는 경우
- 분기 누락이 컴파일에서 잡히지 않는 switch(`never` 검사 없음)

---

## 지적하지 말 것

- lint·typecheck가 검사하는 항목
- `AGENTS.md`에 근거하지 않은 스타일·네이밍 취향
- **"기존 구현과 다르다"는 이유만의 지적.** 기존 구현은 그 자체로 규칙이 아닙니다.
  `AGENTS.md`에 결정된 규칙이 있을 때만 지적합니다.
- `useCallback`/`useMemo` 최적화 제안
- "~를 고려해보세요" 같은 약한 제안이나 질문형 제안
- 이번 PR 이전부터 있던 문제(pre-existing). 단, 이번 PR이 그 코드를 건드려 영향이 커지면 지적합니다.
- [리뷰 제외 파일](#리뷰-제외-파일)의 내용
- [false-positives.md](false-positives.md)의 조건에 해당하는 지적

---

## 리뷰 제외 파일

- `pnpm-lock.yaml`
- `next-env.d.ts`, `.next/**`
- `lib/supabase/database.types.ts`(`pnpm db:types` 생성 파일). 내용 대신 migration과 함께 다시 만들었는지 확인합니다.
- Git에 포함되지 않는 경로: `supabase/review/**`

`supabase/seed.sql`의 장소 목록은 `scripts/generate-place-assets.mjs`가 만듭니다. 내용 대신 `pnpm places:check` 통과 여부를 확인합니다.

---

## 근거 기준

- diff에서 시작하되, head 기준 변경 파일 전체와 직접 의존성·호출부를 확인합니다.
- 권한 주장("anon이 이 table에 쓸 수 있다")에는 두 가지 근거를 함께 적습니다.
  1. 최종 상태의 policy·grant가 있는 migration `파일:라인`
  2. 해당 코드가 쓰는 client 종류(publishable/authenticated/service-role)와 그 `파일:라인`
- 호출부 수, 미사용 여부 같은 cross-file 주장은 검색 결과를 열어 실제 호출인지 확인하고 `파일:라인`을
  적습니다. 구체 위치가 없으면 게시하지 않습니다.
- 권한 변경은 `supabase/tests/database/`의 pgTAP test로 허용·거부를 모두 확인했는지 봅니다. test 없이 policy·grant만 바뀌었으면
  리뷰 요약에 적습니다. Supabase는 table 권한(grant)을 기본으로 넓게 주므로, 실제로 막는 것이 RLS인지 grant인지 구분해 적습니다.
- 구현을 직접 확인하지 않은 상태에서 Critical로 분류하지 않습니다.
- 지적에는 발생 조건, 사용자·운영 영향, 코드 근거, 고치는 방법을 적습니다.
- 확인하지 못한 영역과 실행하지 않은 검증은 리뷰 요약에 남깁니다. 지적이 0개라는 것은 완전히
  검증했다는 뜻이 아닙니다.

---

## 문장 작성 기준

리뷰를 읽는 사람은 이 코드를 처음 이해하는 중일 수 있습니다. 한 번 읽고 **무엇이 문제이고, 왜
문제이고, 어떻게 고치면 되는지** 알 수 있게 씁니다.

- 결론부터 씁니다. 첫 문장에 무엇이 문제인지 적습니다.
- 한 문장에는 한 가지 내용만 씁니다.
- 꼭 필요한 전문 용어는 처음 나올 때 괄호로 풀어 씁니다.
- 번역체("~에 대해", "~을 통해", "~하는 것으로 보입니다")를 쓰지 않습니다.
- "문제가 될 수 있습니다"처럼 막연하게 쓰지 않고, 어떤 상황에서 누가 무엇을 겪는지 적습니다.

| 피할 문장 | 쓸 문장 |
| --- | --- |
| revalidate 누락으로 인한 stale 이슈가 발생할 가능성이 있습니다. | 장소를 수정해도 `PUBLIC_PLACES_CACHE_TAG`를 무효화하지 않습니다. 행사 상세의 주변 명소가 최대 5분 동안 이전 이름으로 보입니다. |

---

## 심각도 기준

| 심각도 | 기준 | 조건 |
| --- | --- | --- |
| 🚨 Critical | 데이터 노출·손실, 권한 우회, 운영 장애 | 재현 시나리오 필수 |
| ⚠️ Major | 특정 조건에서 버그 발생 | 조건 명시 필수 |
| 📝 Minor | 동작하지만 결정된 규칙 위반 | PR당 최대 2개, `AGENTS.md` 규칙 링크 필수 |
| ~~Recommendation~~ | **사용 금지** | Minor로 올리거나 지적하지 않기 |

지적이 0개여도 괜찮습니다. 확신이 낮은 항목은 지적하지 않고 리뷰 요약에 확인하지 못한 점으로 남깁니다.

---

## 리뷰 결과를 다루는 방법

리뷰 후 사용자는 지적마다 수용하거나 반박합니다. 결과는 아래처럼 반영합니다.

- 수용하고, 앞으로도 지켜야 할 규칙이면 → 해당 폴더의 `AGENTS.md`에 규칙으로 추가하고 [결정 기록](../../docs/decisions/conventions.md)에 근거를 남김
- 반박하고, 같은 오탐이 다시 나올 수 있으면 → [false-positives.md](false-positives.md)에 조건과 반례 추가
- 한 번만 맞는 지적이면 → 코드만 고치고 문서에는 남기지 않음
- 같은 문제가 반복되면 → 리뷰 항목을 늘리기보다 test나 lint로 옮길지 결정
